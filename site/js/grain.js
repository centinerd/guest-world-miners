/* Film grain (§9).
   Bake a small monochrome noise tile once and repeat it. Static, cheap,
   non-interactive. Kept faint — it reads as "intentional black", not texture. */
(function () {
  var host = document.getElementById('grain');
  if (!host) return;

  var size = 140;
  var c = document.createElement('canvas');
  c.width = c.height = size;
  var ctx = c.getContext('2d');
  var img = ctx.createImageData(size, size);
  var d = img.data;

  for (var i = 0; i < d.length; i += 4) {
    // gaussian-ish grey by averaging two uniforms — softer than flat noise
    var v = ((Math.random() + Math.random()) * 0.5) * 255;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  host.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
  host.style.backgroundRepeat = 'repeat';
  host.style.backgroundSize = size + 'px ' + size + 'px';
})();
