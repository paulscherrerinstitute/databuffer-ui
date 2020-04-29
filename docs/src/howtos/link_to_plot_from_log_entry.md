# How to link to a plot from a log entry

This document will guide you through the steps to create URL that you can open and view a preconfigured plot. Such a URL can then be put in a log entry to provide easy access to the archived historic data.

This is very similar to [how to link to a plot from a panel](./link_to_plot_from_panel.md). The notable difference is, that **for a log entry** you'll probably want to pin the plot to **fixed start and end times**.

Details on the parameters and values can be taken from the [reference on URL parameters for `/preselect`][reference].

## What we need (input)

1.  The starting URL for _databuffer UI_.
2.  List of channel names.
3.  For each channel: Which backend is it archived to?
4.  The exact time span to show in the plot.

## Step-by-step instructions

For the purpose of this guide, let's assume we want to plot a report of the following channels for April 28th 2020 from 6:00 AM till 9:00 AM:

- SINEG01-CMON-DIA0091:CURRENT-3-3
- SINEG01-CMON-DIA0091:CURRENT-5
- SINEG01-CMON-DIA0091:FAN-SPEED
- SINEG01-CMON-DIA0091:POWER-TOT

All of these channels are archived on the SwissFEL archiver appliance, which has a backend identifier of _sf-archiverappliance_.

### Step 1: Combine all the channel names and their backends into a channel ID

Because _databuffer UI_ can combine data from multiple sources (called backends), it's not enough to just identify a channel by its name, we need to add the backend's name to it:

- sf-archiverappliance/SINEG01-CMON-DIA0091:CURRENT-3-3
- sf-archiverappliance/SINEG01-CMON-DIA0091:CURRENT-5
- sf-archiverappliance/SINEG01-CMON-DIA0091:FAN-SPEED
- sf-archiverappliance/SINEG01-CMON-DIA0091:POWER-TOT

### Step 2: URI encode all the channel IDs

We will pass the parameters in a [query string][query strings]. Inside a query string the forward slash `/` and the colon `:` are special characters that cannot be used directly. They (and others, too) need to be escaped using a special notation:

- sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3
- sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5
- sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED
- sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT

If you want to know more about this, you can [read more about query strings here][query strings].

### Step 3: Assign the channels to parameters

The first channel becomes parameter `c1`, the second channel becomes `c2`, and so on:

- c1=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3
- c2=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5
- c3=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED
- c4=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT

### Step 4: Specify the time span

It's probably easiest to define the times using ISO8601 notation. Don't forget to URI encode these values, too:

- startTime=2020-04-28T06%3A00%3A00.000%2B02%3A00
- endTime=2020-04-28T09%3A00%3A00.000%2B02%3A00

If you're generating these values with a program, you might find it easier to instead use another format. See the [reference] for details on that.

### Step 5: Combine all the parameters into the full URL

The complete URL is made up of the starting point for _databuffer UI_, the entry point `/preselect`, and the parameters.

This yields the following URL: `/preselect?c1=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3&c2=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5&c3=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED&c4=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT&startTime=2020-04-28T06%3A00%3A00.000%2B02%3A00&endTime=2020-04-28T09%3A00%3A00.000%2B02%3A00`

Assuming the starting URL for your instance of _databuffer UI_ is `https://my-data-ui.psi.ch` the full URL will be: https://my-data-ui.psi.ch/preselect?c1=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3&c2=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5&c3=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED&c4=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT&startTime=2020-04-28T06%3A00%3A00.000%2B02%3A00&endTime=2020-04-28T09%3A00%3A00.000%2B02%3A00

### Step 6: Add a link to your log entry

The last step is to add the URL from step 5 to your log entry.

[query strings]: ../topics/query_strings.md
[reference]: ../reference/url_params_preselect.md
