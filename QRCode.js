Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

var qr = $context.image || ($clipboard.image ? $clipboard.image.image : null)
if (qr == null) {
  $qrcode.scan({
    handler(string) {
      showResult(string, false)
    },
    cancelled() {
      $app.close();
    }
  })
} else {
  var text = $qrcode.decode(qr)
  if (text) {
    showResult(text, true)
  } else {
    $ui.alert({
      title: "QR Code Error",
      message: "\nNo QR Code detected.\n",
      actions: [{
        title: "Cancel",
        style: "Cancel",
        handler: function() {
          $system.home()
          $app.close()
        }
      }]
    })
  }
}

function showResult(text, runningExt) {  
  if (text.startsWith("http")){
    $ui.alert({
      title: "OPEN URL?",
      message: text,
      actions: [
        {
          title: "Cancel",
          handler: function() {
            if (runningExt) $context.close();
            $app.close();
          }
        },
        {
          title: "Copy",
          handler: function() {
            $clipboard.set({
              "type": "public.plain-text",
              "value": text
            });
            if (runningExt) $context.close();
            $app.close();
          }
        },
        {
          title: "OK",
          handler: function() {
            $app.openURL(text);
            if (runningExt) $context.close();
            $app.close();
          }
        }
      ]
    });
  } else if (text.startsWith("jsbox://import?")) {
    $ui.alert({
      title: "OPEN JSBox?",
      message: text,
      actions: [
        {
          title: "Cancel",
          handler: function() {
            if (runningExt) $context.close();
            $app.close();
          }
        },
        {
          title: "Copy",
          handler: function() {
            $clipboard.set({
              "type": "public.plain-text",
              "value": text
            });
            if (runningExt) $context.close();
            $app.close();
          }
        },
        {
          title: "OK",
          handler: function() {
            $app.openURL(text);
            if (runningExt) $context.close();
            $app.close();
          }
        }
      ] 
    });
  } else {
    $ui.alert({
      title: "Copy or Search?",
      message: text,
      actions: [
        {
          title: "Cancel",
          style: "Cancel",
          handler: function() {
            if (runningExt) $context.close();
            $app.close();
          }
        },
        {
          title: "Copy",
          handler: function() {
            $clipboard.set({
              "type": "public.plain-text",
              "value": text
            });
            if (runningExt) $context.close();
            $app.close();
          }
        },
        {
          title: "Search",
          handler: function() {
            $ui.menu({
              items: ["Baidu", "Google", "Bing"],
              handler: function(title, idx) {
                switch (idx) {
                  case 0:
                    text = "https://www.baidu.com/s?wd=" + encodeURIComponent(text);
                    break;
                  case 1:
                    text = "https://www.google.com/search?safe=off&q=" + encodeURIComponent(text);
                    break;
                  case 2:
                    text = "https://www.bing.com/search?q=" + encodeURIComponent(text);
                    break;
                }
              }
            });
            $app.openURL(text);
            if (runningExt) $context.close();
            $app.close();
          }
        }
      ]
    })
  }
}


