var $spectrogram = document.querySelector("#spectrogram");
var $indicator = document.querySelector("#indicator");
var $sample = document.querySelector("#sample");
var $play = document.querySelector("#play");
var img = new Image();

$sample.addEventListener("change", function(e)
{
	this.style.display = "none";
	$play.style.display = "block";

	img.addEventListener("load", init);
	$spectrogram.style.backgroundImage = "url('" + (img.src = "img/" + e.target.value.toLowerCase() + ".png") + "')";
});

function init()
{
	$play.innerHTML = "Play &#9654;";

	$play.addEventListener("click", function(e) {
		alert("Please lower your volume before continuing.");
		this.innerHTML = "Now processing.. (5-10s)";
		window.setTimeout(process, 100);
	});
}

function process(e)
{
	var H = img.height;
	var W = img.width;

	// Maximum frequency on the image's y coordinate
	var mfreq = 22050;
	// Duration of the original recording
	var duration = 38;
	// Samples played per second
	var sampleRate = mfreq*2;
	// Required amount of samples per pixel column
	var spc = Math.round(duration*sampleRate/W);
	// Total amount of samples
	var samples = W*spc;
	
	var atx = new AudioContext();
	// Buffer source to handle playback
	var src = atx.createBufferSource();
	// Buffer to store audio samples
	var bfr = atx.createBuffer(1,samples,sampleRate);

	// Store the image inside a canvas to read its pixel data
	var ctx = document.createElement("canvas").getContext("2d");
	ctx.canvas.width = W; ctx.canvas.height = H; ctx.drawImage(img,0,0,W,H);

	var d = ctx.getImageData(0,0,W,H).data;
	var b = bfr.getChannelData(0);
	var i = 0, j, x, y, a, wt;

	// Loop through all frequencies (rows)
	for(y = 0; y < H; y++, i = 0)
	{
		// Loop through all samples (columns)
		for(x = 0; x < W; x++)
		{
			// Get the amplitude and cube it to reduce noise
			a = Math.pow(d[(y*W+x)*4]/255,3);

			// Reject low amplitudes to speed up the process
			if(a<0.01){ i += spc; continue; }

			// Get the frequency
			// w = Math.PI*2*(H-y)/H*mfreq
			// t = i/samples*duration

			// Combine and precalculate sinusoid parameters
			wt = Math.PI*2 * ~~((H-y)/H*mfreq) / samples*duration;

			// Make up missing samples
			for(j = 0; j < spc; j++, i++)
			{ b[i] += a*Math.sin(wt*i); }
		}
	}

	$play.style.display = "none";
	$indicator.style.display = "block";

	// Assign buffer and start playback
	src.buffer = bfr; src.loop = true;
	src.connect(atx.destination);
	src.start();

	var t0 = new Date;

	// Move the indicator on the timeline
	window.setInterval(function()
	{
		var t = Math.min((new Date-t0)/1000,duration);
		if(t==duration) { t0 = new Date; }
		$indicator.style.left = 960/duration*t + "px";

	}, 1000/30);
}
