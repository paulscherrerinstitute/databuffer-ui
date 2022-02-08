# How to correlate two channels

This document will guide you through the steps to create a correlation plot of two channels using _databuffer UI_.

## Scenario

For the purpose of this guide, let's assume we want to correlate the data of the _last 1 minute_ of these channels:

- SINBC01-DBPM010:Q1
- SINBC01-DBPM010:Q2

## Step-by-step instructions

### Step 1: Select the channels for plotting

Open _databuffer UI_ in your browser and search for `SINBC01-DBPM010:Q.$`. Limit the search results to backend _sf-databuffer_ by clicking on the ![sf-databuffer tag](../images/pill_sf_databuffer.png). We use the channels from backend _sf-databuffer_, because this features beam _synchronous_ data acquisition, i.e. the time stamps will match, which is the basis for the correlation.

Now select these channels:

- SINBC01-DBPM010:Q1
- SINBC01-DBPM010:Q2

Click the _correlation button_ ![correlation button](../images/button_correlation.png) to change to the _correlation plot_ view.

### Step 2: Select time range

On the _correlation plot_ view, click on the _quick dial button_ ![quick dial button](../images/button_quick_dial.png) and from the list select "last 1m".

Download the data and plot the correlation by clicking the _plot button_ ![plot button](../images/button_plot.png).

Note, that the number of data points is displayed in the subtitle of the plot.

> **Side note**
>
> The UI will always **request raw data**, in order to create the correlation you requested.
>
> This can take quite a while to process and plot.
>
> E.g. When correlating the above said channels between `2022-02-08 12:00:00.000` and `2022-02-08 12:01:00.000`, there are 5998 data points.
