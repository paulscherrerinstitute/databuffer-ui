# How to link to a plot from a panel

<script>
	var DUI_BASE_URL = window.location.protocol+'//'+ window.location.host;
	function replaceURL(el) {
		el.innerText = el.innerText.replace('https://my-data-ui.psi.ch', DUI_BASE_URL);
	}
	function replaceURLInAllExamples() {
		var i = 1;
		var el = document.getElementById("ex" + i);
		while (el) {
			replaceURL(el);
			i++;
			el = document.getElementById("ex" + i);
		}
	}
</script>

This document will guide you through the steps to create a (HTTP) link to a plot in _databuffer UI_. When a browser visits that link, it will show a preconfigured plot. Such a link can then be put on a panel next to the live data to provide easy access to the archived data. Of course you could also put that link somewhere else, e.g. on a wiki page.

The link we'll create will look something like this:

<code id="ex1">https://my-data-ui.psi.ch/preselect?c1=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3&c2=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5&c3=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED&c4=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT&duration=14400000</code>

Through this series of steps we will be constructing a URL (a link's address) by adding parameters that configure the plot. In particular, we need to tell _databuffer UI_ which channels to plot and for what time range.

This how-to guide will not go into detail on what parameters exist, all the possible values they could take, or the reason behind transforming the representation. If you feel you need more information on what is possible to express with the parameters, you can find all the details on the available parameter names and values in the [reference on URL parameters for `/preselect`][reference]. If you'd like to know more details on how to represent the parameters, have a look at the [topic guide on working with URL query strings][query strings].

This how-to guide is very similar to [how to link to a plot from a log entry](./link_to_plot_from_log_entry.md). The notable difference is, that **for a panel** you'll probably want to **view the recent history** (e.g. the last hour _up to now_) of some channels, e.g. in order to identify a trend or to compare them to the current live data, while **for a log entry** you'll probably want to view **fixed** start and end **times**.

## What you'll need to complete this how-to

To follow through the steps of this how-to guide you will need the following list of things:

1.  The starting URL for _databuffer UI_.<br>
    This is probably where you're reading this manual from, so you're probably already set. Also, there's a generated "guess" in step 1.

2.  List of channel names.<br>
    For the purpose of this how-to you will probably want to use the channels that are on the panel where you want to put the link. If you're not sure or need to add others, you can [search for channels on _databuffer UI_ interactively](/search). (This link will leave the online manual.) The channel name is part of the search results.

3.  For each channel: Which backend is it archived to?<br>
    If you don't know, where a channel is archived to, or how _databuffer UI_ identifies the backend, you can [search for channels on _databuffer UI_ interactively](/search). (This link will leave the online manual.) The backend identifier is part of the search results.

4.  The time span to show in the plot.

## Step-by-step instructions

### Scenario

For the purpose of this guide, let's assume we want to plot the _last 4 hours_ of the following _channels_:

- SINEG01-CMON-DIA0091:CURRENT-3-3
- SINEG01-CMON-DIA0091:CURRENT-5
- SINEG01-CMON-DIA0091:FAN-SPEED
- SINEG01-CMON-DIA0091:POWER-TOT

All of these channels are archived on the SwissFEL archiver appliance, which has a backend identifier of _sf-archiverappliance_.

### Step 1: Starting URL

Let's start at the beginning. The beginning of the URL we are building in this how-to guide is the internet address of _databuffer UI_. In case you are reading this online from _databuffer UI_ itself, I can try to guess it for you.

Here's my guess: <span id="ex2" style="font-weight:bold">https://my-data-ui.psi.ch</span>

Now that we established the start URL of _databuffer UI_, let's add the location of the entry point by adding `/preselect`:

<code id="ex3">https://my-data-ui.psi.ch/preselect</code>

### Step 2: Combine all the channel names and their backends into a channel ID

Because _databuffer UI_ can combine data from multiple sources (called backends), it's not enough to just identify a channel by its name, we need to add the backend's name to it. In _databuffer UI_ a channel which is fully qualified in this way is called a _channel ID_. For the channels of this how-to the channel IDs are:

- sf-archiverappliance/SINEG01-CMON-DIA0091:CURRENT-3-3
- sf-archiverappliance/SINEG01-CMON-DIA0091:CURRENT-5
- sf-archiverappliance/SINEG01-CMON-DIA0091:FAN-SPEED
- sf-archiverappliance/SINEG01-CMON-DIA0091:POWER-TOT

### Step 3: URI encode all the channel IDs

We will pass the channel IDs to _databuffer UI_ through parameters in the URL. URLs have a part that is reserved for exactly this purpose. That part of the URL is called the _query string_, and it can be added to the end of a URL after a question mark `?`. The question mark `?` and other characters, e.g. the forward slash `/` and the colon `:` which are part of our channel IDs, need to be transformed before they can be used in a query string. In our case:

- `/` becomes `%2F`
- `:` becomes `%3A`

So the results of the transformations are:

- sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3
- sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5
- sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED
- sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT

But really, the easiest way to convert the channel IDs into an encoded form suitable for the link is to use an online tool. Use your favourite internet search engine and search for "URL encode online".

It's not required for the rest of the how-to, but if you're interested, you can read more about this in the [topic guide on working with URL query strings][query strings].

### Step 4: Assign the channels to parameters

Now we can come back to the URL we're constructing and start adding parameters. You can select channels by setting parameters `c1`, `c2`, ... up to `c16`. The `name=value` pairs for the parameters are:

- c1=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3
- c2=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5
- c3=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED
- c4=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT

To add them to the URL, add `?` to the URL we have so far, and separate the `name=value` pairs by `&`:

<code id="ex4">https://my-data-ui.psi.ch/preselect?c1=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3&c2=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5&c3=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED&c4=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT</code>

Actually, at this point you have a working link that will result in a plot. If you like, try it out: Copy and paste your link into the address field of a new browser window.

### Step 5: Specify the time span

As you've seen at the end of the previous step, _databuffer UI_ will just use a default duration as we haven't specified one in a parameter. (The actual default might change, so it's not noted here, so that this guide doesn't become outdated.)

But, according to the introductory setup, let's assume we want to set the plot to specifically show the last 4 hours. We'll need to supply the duration in milliseconds as a plain number (no thousands separators or such).

For your convenience here are a few time spans in milliseconds you can copy & paste if you'd like to experiment a bit:

- 15 minutes: 900000
- 30 minutes: 1800000
- 1 hour: 3600000
- 2 hours: 7200000
- 4 hours: 14400000
- 8 hours: 28800000
- 12 hours: 43200000
- 16 hours: 57600000
- 24 hours: 86400000

So, we can see, that 4 hours = 14400000 milliseconds (4 &times; 60 &times; 60 &times; 1000). Let's add this to the URL in the `duration` parameter:

<code id="ex5">https://my-data-ui.psi.ch/preselect?c1=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3&c2=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5&c3=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED&c4=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT&duration=14400000</code>

### Step 6: Add a link to your panel

The very last step, just to wrap things up, is to add a link to your panel with the full URL from step 5.

[query strings]: ../topics/query_strings.md
[reference]: ../reference/url_params_preselect.md

<script>replaceURLInAllExamples();</script>
