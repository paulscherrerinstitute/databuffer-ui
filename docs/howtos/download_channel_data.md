# How to download channel data

This document will guide you through the steps to download data from the data API using _databuffer UI_.

## Scenario

For the purpose of this guide, let's assume we want to download the raw data of the _last 4 hours_ of the following _channels_:

- SINEG01-CMON-DIA0091:CURRENT-3-3
- SINEG01-CMON-DIA0091:CURRENT-5
- SINEG01-CMON-DIA0091:FAN-SPEED
- SINEG01-CMON-DIA0091:POWER-TOT

## Step-by-step instructions

### Step 1: Select the channels for plotting

Open _databuffer UI_ in your browser and search for `SINEG01-CMON-DIA0091`. From the search results select these channels:

- SINEG01-CMON-DIA0091:CURRENT-3-3
- SINEG01-CMON-DIA0091:CURRENT-5
- SINEG01-CMON-DIA0091:FAN-SPEED
- SINEG01-CMON-DIA0091:POWER-TOT

Click on button _plot selected_ ![plot selected](../images/button_plot_selected.png) to change to the _plot_ view.

### Step 2: Select time range

On the _plot_ view, check if the text fields for _Start_ and _End_ are displayed:

![plot range](../images/plot_range.png)

If they are not currently displayed, click the _select plot range_ tool button ![select plot range](../images/tool_button_select_plot_range.png).

Now click on the _quick dial button_ ![quick dial button](../images/button_quick_dial.png) and from the list select "last 1h". Then enter the _Start_ text field and adjust the hours, so that the time difference between _Start_ and _End_ is 4 hours.

If you want, you can preview the plot by clicking the _plot button_ ![plot button](../images/button_plot.png).

### Step 3: Download data

Click the _download data_ tool button ![share link](../images/tool_button_download.png) to bring up the _Download data as CSV_ dialog.

![Download data as CSV dialog](../images/dialog_download_data_csv.png)

Because our scenario said, we want to download the _raw_ data, choose _Get raw data_.

Click the _download_ button ![copy URL](../images/button_download.png) to download the raw data in CSV format.

> **Side note**
>
> In the dialog, you can choose different types of data aggregation. When aggregating the data, multiple data points are combined into a _bin_.
>
> - **Download data of plot (as is)** will download the data using the exact same aggregation as _databuffer UI_ uses, when it draws the plot. I.e. it aggregates by limiting the number of bins. The duration of each bin will depend on the _Start_ and _End_ time of the plot.
> - **Aggregate by 5 seconds** will aggregate data using a duration of 5 seconds per bin.
> - **Aggregate by 1 minute** will aggregate data using a duration of 1 minute per bin.
> - **Aggregate by 1 hour** will aggregate data using a duration of 1 hour per bin.
> - **Get raw data** will disable data aggregation and download all available data.

The download from data API will start in the background. Once it has finished it will appear in your browser's downloads. This may take a long time, because there may be a lot of data.

## Bonus: download via `curl`

Did you notice the button ![copy curl command to clipboard](../images/button_copy_curl_command.png)?

`curl` is a command line program that allows you to issue HTTP requests (and downloads) from the command line (or shell or terminal). To get the CSV data from the data API web service, you'll need to send a specific request to it. Writing that by hand can be a bit tedious.

By clicking that button, _databuffer UI_ will copy a `curl` command to your clipboard, that will issue the same query for CSV data, as _databuffer UI_ itself would do, when you click the download button. Now all you have to do is paste the command into a terminal and run it.

You can use that command as a starting point for tweaking parameters, if you need a specific type of download, that is not provided through the UI itself.

You'll find all the details on the available parameters in the documentation of [the query REST API of the data API service](https://git.psi.ch/sf_daq/ch.psi.daq.databuffer/blob/master/ch.psi.daq.queryrest/Readme.md).
