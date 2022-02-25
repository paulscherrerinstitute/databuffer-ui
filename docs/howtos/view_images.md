# How to view images from a camera channel

This document will guide you through the steps to view images from a channel using _databuffer UI_.

## Scenario

For the purpose of this guide, let's assume we want to view the images recorded from this channel:

- SARES20-CAMS142-M3:FPICTURE

## Step-by-step instructions

### Step 1: Select the channel for plotting

Open _databuffer UI_ in your browser and search for `SARES.*FPICTURE`. Limit the search results to image channels by clicking on the ![2d tag](../images/pill_2d.png).

Now select channel _SARES20-CAMS142-M3:FPICTURE_.

Click the _view button_ ![view button](../images/button_view.png) to change to the _image viewer_ view.

### Step 2: Select time range

On the _correlation plot_ view, click on the _quick dial button_ ![quick dial button](../images/button_quick_dial.png) and from the list select "last 1h".

Download the first slice of data by clicking the _plot button_ ![plot button](../images/button_plot.png).

If you want to load the next slice, click the _load more button_ ![load more button](../images/button_load_more.png).

> **Side note**
>
> Databuffer UI will always **request data in slices of 10 seconds**, in order not to overwhelm the backend.
>
> It might take a while to find the first slice that has some data. If you want to abort the process click the _cancel button_ ![cancel button](../images/button_cancel.png) in the progress indicator ![loading slice progress indicator](../images/loading_slice.png).
