# How to link to a plot from a panel

This document will guide you through the steps to create URL that you can open and view a preconfigured plot. Such a URL can then be put on a panel next to the live view of data to provide easy access to the archived historic data.

This is very similar to [how to link to a plot from a log entry](./link_to_plot_from_log_entry.md). The notable difference is, that **for a panel** you'll probably want to **view the recent history** of some channels to compare them to the current live data.

Details on the parameters and values can be taken from the [reference on URL parameters for `/preselect`][reference].

## What we need (input)

1.  The starting URL for _databuffer UI_.
2.  List of channel names.
3.  For each channel: Which backend is it archived to?
4.  The time span to show in the plot.

## Step-by-step instructions

For the purpose of this guide, let's assume we want to plot the last 4 hours of the following channels:

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

If you're happy wiht _databuffer UI_'s default time span, you can skip this step.

But, according to the introductory setup, let's assume we want to set the plot to specifically show the last 4 hours. 4 hours = 14400000 milliseconds (4 &times; 60 &times; 60 &times; 1000).

- duration=14400000

### Step 5: Combine all the parameters into the full URL

The complete URL is made up of the starting point for _databuffer UI_, the entry point `/preselect`, and the parameters.

This yields the following URL: `/preselect?c1=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3&c2=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5&c3=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED&c4=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT&duration=14400000`

Assuming the starting URL for your instance of _databuffer UI_ is `https://my-data-ui.psi.ch` the full URL will be: https://my-data-ui.psi.ch/preselect?c1=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-3-3&c2=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3ACURRENT-5&c3=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED&c4=sf-archiverappliance%2FSINEG01-CMON-DIA0091%3APOWER-TOT&duration=14400000

### Step 6: Add a link to your panel

The last step is to add a link to your panel with the full URL from step 5.

[query strings]: ../topics/query_strings.md
[reference]: ../reference/url_params_preselect.md
