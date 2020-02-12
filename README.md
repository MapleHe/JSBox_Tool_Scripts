# JSBox_Scripts

JSBox tool scripts for self-use.

## Scrips Description

### ImgPlus

Source: <https://github.com/coo11/JSBoxScript/Img+.js>

Modification: Delete network-based function.

### QRCode

Source: <https://github.com/axelburks/JSBox/blob/master/XQRcode.js>

The script has been modified drasticly.

Modification:

+ Delete APP scheme detection.
+ Delete Update function.
+ Add "http" detection.
+ Add "jsbox://import?" detection.
+ Set three handlers for all detected result: "Cancel", "Copy", "Execution".

### PinPlus

Source:

+ Basic framework: "Pin+" <https://github.com/coo11/pin>
+ Function Reference: "XPin" <https://github.com/axelburks/JSBox/tree/master/XPin>

Modification:

+ Add "action" backup&restore function like XPin to Pin+.
+ Fix the display error in "scroll method" setting of bottom action frame.

Note:

If the widget is in "basic" mode, the "scroll" of bottom action frame won't work normally. "More memory mode" will make it.

