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
	$spectrogram.src = img.src = e.target.value.toLowerCase() + ".png";
});

function init()
{
	$play.innerHTML = "Play &#9654;";

	$play.addEventListener("click", function(e) {
		alert("Please lower your volume before continuing.");
		this.innerHTML = "Now processing. This takes about 10 seconds.";
		this.style.borderTop = "none";
		window.setTimeout(process, 100);
	});
}

function process(e)
{
	var H = img.height;
	var W = img.width;

	// Maximum frequency on the image's y coordinate
	var mfreq = 22000;
	// Duration of the original recording
	var duration = 38;
	// Samples played per second
	var sampleRate = 20000;
	// Required amount of samples per pixel column
	var spc = Math.round(duration*sampleRate/W);
	// Total amount of pixels
	var samples = W*spc;
	
	var atx = new AudioContext();
	// Buffer source to handle playback
	var src = atx.createBufferSource();
	// Buffer to store audio samples
	var bfr = atx.createBuffer(1,samples,sampleRate);

	// Store the image inside a canvas
	var ctx = document.createElement("canvas").getContext("2d");
	ctx.canvas.width = W; ctx.canvas.height = H; ctx.drawImage(img,0,0,W,H);

	var d = ctx.getImageData(0,0,W,H).data;
	var b = bfr.getChannelData(0);
	var i = 0, j, x, y, a;

	for(x = 0; x < W; x++)
	{
		// Make up missing samples
		for(j = 0; j < spc; j++, i++)
		{
			// Add all sinusoids on a pixel column
			for(y = 0; y < H; y++)
			{
				// Get the amplitude and cube it to reduce noise
				a = Math.pow(d[(y*W+x)*4]/255,3);
				// Reject low amplitudes to speed up the process
				if(a<0.01)continue;

				// Add the sinusoid
				b[i] += a*Math.cos(
					Math.PI*2*
					// Frequency
					(H-y)/H*mfreq*
					// Time
					i/samples*duration
				);
			}
		}
	}

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

	// Hide the play button
	$play.style.display = "none";
}