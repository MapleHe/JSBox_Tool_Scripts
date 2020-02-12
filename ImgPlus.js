/*
Modified version of Img+.js from https://github.com/coo11/JSBoxScript for self-use. Delete network-dependent functions.

- 快速查看一张图片的基本信息比如大小、 尺寸、类型，复制图片的 MD5
- 图片大小调整(PNG, JPG) GIF倒放 水平、垂直翻转(GIF, PNG, JPG)
- 查看二维码
- 删除 EXIF
- 制作九宫格
*/

const dark = $device.isDarkMode,
  separatorColor = dark ? $rgba(100, 100, 100, 0.8) : $color("separator"),
  sW = $device.info.screen.width,
  sH = sW * 0.618,
  pic = $context.dataItems,
  list = [
    ["调整大小", "水平翻转", "垂直翻转", "GIF 倒放"],
    [
      "扫描二维码",
      "删除 EXIF",
      "制作九宫格",
      "Exit"
    ]
  ];

let type;

function initList(i) {
  let items = [];
  list[i].map(x => {
    items = items.concat({
      list: { text: x }
    });
  });
  return items;
}

let _type = ["image/gif", "image/jpeg", "image/png"].includes(
  pic === undefined ? "" : pic[0].info.mimeType
);
if (pic && _type) {
  type = pic[0].info.mimeType.replace("image/", "").toLowerCase();
  render(pic[0]);
} else if ($context.imageItems) {
  type = "jpeg";
  render($context.image.jpg(1.0));
} else {
  $ui.menu({
    items: ["从相册选", "最后一张"],
    handler: (t, i) => {
      i == 0 ? pick() : last();
    }
  });
}

async function pick() {
  let resp = await $photo.pick({ format: "data" });
  type = resp.data.info.mimeType.replace("image/", "").toLowerCase();
  render(resp.data);
}

async function last() {
  let resp = await $photo.fetch({ count: 1, format: "data" });
  type = resp[0].info.mimeType.replace("image/", "").toLowerCase();
  render(resp[0]);
}

function format(bytes) {
  let formatter = $objc("NSByteCountFormatter");
  let string = formatter.$stringFromByteCount_countStyle(bytes, 0);
  return string.rawValue();
}

function reverse(img, i) {
  let size = img.size,
    frame = $rect(0, 0, size.width, size.height),
    view = {
      type: "view",
      props: {
        id: "temp",
        frame: frame
      },
      views: [
        {
          type: "canvas",
          layout: $layout.fill,
          props: { frame: frame },
          events: {
            draw: (view, ctx) => {
              ctx.scaleCTM(-i, i);
              i == 1
                ? ctx.translateCTM(-size.width, 0)
                : ctx.translateCTM(0, -size.height);
              ctx.drawImage(frame, img);
            }
          }
        }
      ]
    },
    canvas = $ui.create(view);
  let reversed = canvas.snapshotWithScale(1);
  return reversed;
}

function gifReverse(data, _i) {
  let decoder = $objc("YYImageDecoder").invoke(
      "decoderWithData:scale",
      data,
      1
    ),
    encoder = $objc("YYImageEncoder").invoke("alloc.initWithType", 7),
    frameCount = decoder.invoke("frameCount"),
    _frame,
    rFrame;
  for (let i = 0; i < frameCount; i++) {
    let duration = decoder.invoke("frameDurationAtIndex", i);
    let frame = decoder.invoke("frameAtIndex:decodeForDisplay", i, 0);
    _frame = frame.invoke("image").jsValue();
    rFrame = reverse(_frame, _i);
    $("temp").remove();
    encoder.invoke("addImage:duration", rFrame.ocValue(), duration);
  }
  return encoder.invoke("encode").jsValue();
}

function gifPlayback(data) {
  let decoder = $objc("YYImageDecoder").invoke(
      "decoderWithData:scale",
      data,
      1
    ),
    encoder = $objc("YYImageEncoder").invoke("alloc.initWithType", 7),
    frameCount = decoder.invoke("frameCount");
  for (let i = frameCount - 1; i >= 0; i--) {
    let duration = decoder.invoke("frameDurationAtIndex", i);
    let frame = decoder.invoke("frameAtIndex:decodeForDisplay", i, 0);
    encoder.invoke("addImage:duration", frame.invoke("image"), duration);
  }
  return encoder.invoke("encode").jsValue();
}

function resizedImage(img) {
  let outputImage;
  if (type == "gif") outputImage = img;
  else if (type == "png") outputImage = img.png;
  else outputImage = img.jpg(1.0);
  shareIt(outputImage);
}

function imgResize(img) {
  let size = img.image.size;
  return {
    type: "blur",
    props: {
      style: dark ? 3 : 5,
      alpha: 0,
      hidden: 1,
      radius: 10,
      id: "resize",
      borderWidth: 0.4,
      bgcolor: $color("clear"),
      borderColor: $rgba(100, 100, 100, 0.25)
    },
    layout: (make, view) => {
      make.size.equalTo($size(sW * 0.75, sH * 0.75));
      make.centerX.equalTo(view.super);
      make.top.equalTo(view.super.safeAreaTop).offset(44 + sH * 0.5);
    },
    views: [
      {
        type: "input",
        props: {
          id: "width",
          text: String(size.width),
          borderWidth: 0.4,
          textColor: $color(dark ? "white" : "black"),
          bgcolor: $color(dark ? "#A2A2A2" : "white"),
          borderColor: $rgba(100, 100, 100, 0.25),
          type: $kbType.decimal,
          placeholder: "宽"
        },
        layout: resizeLayout(-1, -1),
        events: {
          tapped(sender) {
            sender.focus();
          },
          changed: sender => {
            $("height").text =
              $("type").title == "比例"
                ? (sender.text * size.height) / size.width
                : sender.text;
            if (sender.text == "") $("height").text == "";
          }
        }
      },
      {
        type: "input",
        props: {
          id: "height",
          text: String(size.height),
          borderWidth: 0.4,
          textColor: $color(dark ? "white" : "black"),
          bgcolor: $color(dark ? "#A2A2A2" : "white"),
          borderColor: $rgba(100, 100, 100, 0.25),
          type: $kbType.decimal,
          placeholder: "高"
        },
        layout: resizeLayout(-1, 1),
        events: {
          tapped(sender) {
            sender.focus();
          },
          changed: sender => {
            $("width").text =
              $("type").title == "比例"
                ? (sender.text * size.width) / size.height
                : sender.text;
            if (sender.text == "") $("width").text == "";
          }
        }
      },
      {
        type: "button",
        props: {
          id: "type",
          title: "比例",
          titleColor: $color(dark ? "white" : "tint"),
          borderWidth: 0.4,
          bgcolor: $rgba(255, 255, 255, 0.25),
          borderColor: $rgba(100, 100, 100, 0.25)
        },
        layout: resizeLayout(1, -1),
        events: {
          tapped(sender) {
            $device.taptic(0);
            if (sender.title == "比例") {
              sender.title = "像素";
              if ($("width").text != "")
                $("width").text = $("width").text / size.width;
              if ($("height").text != "")
                $("height").text = $("height").text / size.height;
            } else {
              sender.title = "比例";
              if ($("width").text != "")
                $("width").text = $("width").text * size.width;
              if ($("height").text != "")
                $("height").text = $("height").text * size.height;
            }
          }
        }
      },
      {
        type: "button",
        props: {
          title: "完成",
          borderWidth: 0.4,
          bgcolor: $rgba(255, 255, 255, 0.25),
          borderColor: $rgba(100, 100, 100, 0.25),
          titleColor: $color(dark ? "white" : "tint")
        },
        layout: resizeLayout(1, 1),
        events: {
          tapped(sender) {
            $("width").blur();
            $("height").blur();
            let resized =
              $("type").title == "比例"
                ? img.image.resized($size($("width").text, $("height").text))
                : img.image.resized(
                    $size(
                      $("width").text * size.width,
                      $("height").text * size.height
                    )
                  );
            resizedImage(resized);
            $("menubg").remove();
            menuAnimate(sender.super.super);
          }
        }
      }
    ]
  };
}

function resizeLayout(a, b) {
  return (make, view) => {
    make.width.equalTo(sW * 0.25 * 0.75);
    make.height.equalTo(30);
    make.centerY.equalTo(view.super).offset(sH * 0.14 * a);
    make.centerX.equalTo(view.super).offset(sW * 0.14 * b);
  };
}

function menuAnimate(view) {
  if (view.hidden == false)
    $ui.animate({
      duration: 0.5,
      damping: 1,
      velocity: 1,
      animation: () => {
        view.alpha = 0;
      },
      completion: () => {
        view.remove();
      }
    });
  else {
    view.hidden = 0;
    $ui.animate({
      duration: 0.5,
      damping: 0,
      velocity: 1,
      animation: () => {
        view.alpha = 1;
      }
    });
  }
}

function render(img) {
  let imgData = img;
  let imgSize = img.info.size /1000/1000;
  let imgMD5 = $text.MD5(img);
  let imgW = img.image.size.width;
  let imgH = img.image.size.height;
  let imgU = imgH / imgW >= 0.618;
  let imgpW = (imgW * sH) / imgH; //以屏宽的 0.618 为基准缩放;
  let imgpH = (imgH * sW) / imgW; //以屏宽为基准缩放;
  let imgrW = imgW >= sW;
  let imgrH = imgH >= sH;
  $ui.render({
    props: {
      navBarHidden: 1,
      statusBarStyle: Number(dark),
      bgcolor: $color(dark ? "black" : "white")
    },
    views: [
      {
        type: "scroll",
        props: {
          bgcolor: $color("clear"),
          scrollEnabled: imgrW || imgrH,
          showsVerticalIndicator: 0,
          showsHorizontalIndicator: 0,
          contentSize: $size(imgrH ? imgpW : imgW, imgrW ? imgpH : imgH)
        },
        layout: (make, view) => {
          make.left.right.inset(0);
          make.height.equalTo(sH);
          make.top.equalTo(view.super.safeAreaTop).offset(44);
        },
        events: {
          ready: sender => {
            sender.clipsToBounds = 0;
          },
          tapped: () => {
            $quicklook.open({ data: imgData });
          }
        },
        views: [
          {
            type: "image",
            props: { data: imgData, bgcolor: $color("clear") },
            layout: (make, view) => {
              if (!imgrW && !imgrH) {
                make.center.equalTo(view.super);
              } else if (imgU) {
                make.centerX.equalTo(view.super);
                make.width.equalTo(imgrW ? sW : imgW);
                make.height.equalTo(imgrW ? imgpH : imgH);
              } else {
                make.centerY.equalTo(view.super);
                make.height.equalTo(imgrH ? sH : imgH);
                make.width.equalTo(imgrH ? imgpW : imgW);
              }
            }
          }
        ]
      },
      {
        type: "list",
        props: {
          separatorColor,
          bounces: 0,
          stickyHeader: 1,
          borderWidth: 0.2,
          bgcolor: $color(dark ? "black" : "white"),
          borderColor: $rgba(100, 100, 100, 0.25),
          data: [
            { title: "调整", rows: initList(0) },
            { title: "其他", rows: initList(1) }
          ],
          font: $font(6),
          template: {
            props: { bgcolor: $color("clear") },
            views: [
              {
                type: "label",
                props: {
                  id: "list",
                  textColor: $color(dark ? "white" : "#333")
                },
                layout: (make, view) => {
                  make.centerY.equalTo(view.super);
                  make.top.right.bottom.inset(0);
                  make.left.inset(15);
                }
              }
            ]
          }
        },
        layout: (make, view) => {
          make.left.right.inset(0);
          make.top.equalTo(view.prev.bottom);
          make.bottom.equalTo(view.super.safeAreaBottom).offset(-81);
        },
        events: {
          didSelect: (sender, indexPath) => {
            let sec = indexPath.section,
              row = indexPath.row;
            switch (sec) {
              case 0:
                switch (row) {
                  case 0:
                    if (type == "gif") {
                      $ui.error("暂时不支持 GIF", 0.6);
                      return;
                    }
                    $ui.window.add({
                      type: "view",
                      props: { id: "menubg" },
                      layout: $layout.fill,
                      events: {
                        tapped(sender) {
                          menuAnimate($("resize"));
                          sender.remove();
                        }
                      }
                    });
                    $ui.window.add(imgResize(imgData));
                    menuAnimate($("resize"));
                    break;
                  case 1:
                    resizedImage(
                      type == "gif" ? gifReverse(imgData, 1) : reverse(imgData.image, 1)
                    );
                    break;
                  case 2:
                    resizedImage(
                      type == "gif"
                        ? gifReverse(imgData, -1)
                        : reverse(imgData.image, -1)
                    );
                    break;
                  case 3:
                    type == "gif"
                      ? resizedImage(gifPlayback(imgData))
                      : $ui.error("该图片格式不是 GIF", 0.6);
                    break;
                }
                break;
              case 1:
                switch (row) {
                  case 0:
                    scanQrCode(imgData.image);
                    break;
                  case 1:
                    $ui.menu({
                      items: ["PNG", "JPEG"],
                      handler: (t, i) => {
                        i == 0
                          ? $share.sheet(imgData.image.png)
                          : $share.sheet(imgData.image.jpg(1.0));
                      }
                    });
                    break;
                  case 2:
                    nineColumn(imgData.image);
                  case 3:
                    $app.close();
                }
                break;
            }
          },
        }
      },
      {
        type: "blur",
        props: {
          bgcolor: $color("clear"),
          style: dark ? 3 : 5,
          borderWidth: 0.4,
          borderColor: $rgba(100, 100, 100, 0.25)
        },
        layout: (make, view) => {
          make.top.left.right.inset(0);
          make.bottom.equalTo(view.super.safeAreaTop).offset(44);
        },
        views: [
          {
            type: "label",
            props: {
              text: "ImgPlus",
              font: $font("Lato-Medium", 20),
              textColor: $color(dark ? "white" : "tint")
            },
            layout: (make, view) => {
              make.centerX.equalTo(view.super);
              make.centerY.equalTo(view.super.safeArea);
            }
          }
        ],
        events: { tapped: () => $app.close() }
      },
      {
        type: "blur",
        props: {
          style: dark ? 3 : 5,
          bgcolor: $color("clear")
        },
        layout: (make, view) => {
          make.left.right.bottom.inset(0);
          make.top.equalTo(view.super.safeAreaBottom).offset(-81);
        },
        views: [
          {
            type: "label",
            props: {
              text:
                "尺寸:  " +
                imgW +
                " * " +
                imgH +
                "   大小:  " +
                imgSize.toFixed(2) +
                "MB   类型:  " +
                type.toUpperCase(),
              font: $font(12),
              textColor: $color(dark ? "white" : "#333")
            },
            layout: (make, view) => {
              make.centerX.equalTo(view.super);
              make.centerY.equalTo(view.super).offset(-13.5);
            }
          },
          {
            type: "label",
            props: {
              text: "MD5: ",
              font: $font(12),
              textColor: $color(dark ? "white" : "#333")
            },
            layout: (make, view) => {
              make.left.equalTo(view.prev);
              make.centerY.equalTo(view.super).offset(13.5);
            }
          },
          {
            type: "button",
            props: {
              radius: 10,
              font: $font(11),
              borderWidth: 0.8,
              title: " " + imgMD5 + " ",
              titleColor: $color(dark ? "white" : "#333"),
              bgcolor: $rgba(200, 200, 200, 0.25),
              borderColor: $rgba(100, 100, 100, 0.25)
            },
            layout: (make, view) => {
              make.left.equalTo(view.prev.right).offset(2);
              make.centerY.equalTo(view.prev);
              make.height.equalTo(20);
            },
            events: {
              tapped(sender) {
                $clipboard.text = imgMD5;
                $ui.toast("MD5 已复制到剪贴板", 0.6);
              }
            }
          }
        ]
      }
    ]
  });  
}

function scanQrCode(img) {
  let menu = ["分享文本", "复制文本"];
  let _menu = ["打开链接", "发送邮件", "拨打电话", "发送短信"];
  let i;
  let t = $qrcode.decode(img);
  let c = $detector.link(t);
  if (t == "") {
    $ui.error("未检测出二维码内容", 0.6);
    return;
  } else if (c.length > 0) i = 0;
  else {
    c = t.match(/^([a-zA-Z0-9])(\w|-)+@[a-zA-Z0-9-]+\.([a-zA-Z]{2,6})$/) || [];
    if (c.length > 0) i = 1;
    else {
      c = $detector.phoneNumber(t);
      if (c.length > 0) i = 2;
    }
  }
  typeof i === "number" && menu.push(_menu[i]);
  i === 2 && menu.push(_menu[3]);
  $ui.menu(menu).then(resp => {
    if ("index" in resp) {
      let j = resp.index;
      if (j == 0) $share.sheet(t);
      else if (j == 1) {
        $clipboard.text = t;
        $ui.toast("已复制", 0.6);
      } else {
        if (i === 0) $app.openURL(c[0]);
        else if (i === 1) $app.openURL("mailto:" + c[0]);
        else
          j === 2 ? $app.openURL("tel:" + c[0]) : $app.openURL("sms:" + c[0]);
      }
    }
  });
}

function nineColumn(img) {
  const { width, height } = img.size;
  if (Math.min(width, height) < 3) {
    $ui.error("图片尺寸过小");
    return;
  }
  const w = width / 3,
    h = height / 3,
    locations = [
      [0, 0],
      [-w, 0],
      [-w * 2, 0],
      [0, -h],
      [-w, -h],
      [-w * 2, -h],
      [0, -h * 2],
      [-w, -h * 2],
      [-w * 2, -h * 2]
    ];
  let sets = [];
  for (let i of locations) {
    let view = $ui.create({
      type: "canvas",
      props: {
        frame: $rect(0, 0, w, h)
      },
      views: [
        {
          type: "image",
          props: {
            image: img,
            contentMode: $contentMode.center,
            frame: $rect(...i, width, height)
          }
        }
      ]
    });
    sets.push(view.snapshotWithScale(1));
  }
  $ui.menu({
    items: ["PNG", "JPEG"],
    handler: (t, i) => {
      sets = i == 0 ? sets.map(x => x.png) : sets.map(x => x.jpg(1.0));
      $share.sheet({
        items: sets,
        handler: success => success && $ui.toast("操作完毕")
      });
    }
  });
}

function shareIt(data) {
  $ui.menu(["预览", "分享", "保存"]).then(res => {
    if ("index" in res) {
      if (res.index == 0) $quicklook.open({ data: data });
      else if (res.index == 1)
        $share.sheet({
          items: [data],
          handler: success => success && $ui.toast("已分享", 0.6)
        });
      else
        $photo.save({
          data: data,
          handler: success => success && $ui.toast("已保存至相册", 0.6)
        });
    }
  });
}

(async () => {
  if ($app.env != $env.app) return;
})();
