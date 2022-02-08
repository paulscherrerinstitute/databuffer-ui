# FAQs <!-- omit in toc -->

Here are several frequently asked questions, and their answers.

- [1. Why is my data aggregated?](#1-why-is-my-data-aggregated)
- [2. How can I see raw data?](#2-how-can-i-see-raw-data)
- [3. How can I check if a channel is aggregated?](#3-how-can-i-check-if-a-channel-is-aggregated)
- [4. How can I check if a channel is recording?](#4-how-can-i-check-if-a-channel-is-recording)
- [5. What does 'query expansion' mean?](#5-what-does-query-expansion-mean)
- [6. Why is the correlation plot empty?](#6-why-is-the-correlation-plot-empty)
- [7. Why can I not correlate two channels?](#7-why-can-i-not-correlate-two-channels)

## 1. Why is my data aggregated?

For each channel Databuffer UI always starts with a request for aggregated data with a maximum of 500 data points (bins). When the response comes in, the number of events in each of the (up to) 500 bins are summed up. If in total there are fewer than 500 data events in the bins, Databuffer UI will request the unbinned data for the channel.

If that channel is a wave form, there is still some aggregation going on, even if there are fewer than 500 data points in the time range. I.e. the displayed value is the _mean_ of all values in the array of the wave form. If you click on one of the data points, you will get to the index plot. See also: [How to plot wave forms with the index plot](./howtos/index_plot.md)

## 2. How can I see raw data?

Databuffer UI will show you the raw data, if there are fewer than 500 data points and the channel is a _scalar_ value (see [Why is my data aggregated](#1-why-is-my-data-aggregated)). If the channel is a wave form, you'll have to use an index plot: [How to plot wave forms with the index plot](./howtos/index_plot.md)

You can either reduce the queried time range by editing the start and end times, or you can zoom with reload. See also: [How to zoom and navigate in a plot](./howtos/zoom_navigate_plot.md)

## 3. How can I check if a channel is aggregated?

You can see this on the "Channel info" screen.

**Please note:** This information is only available _after_ you requested the data by clicking on the "Plot" button. (Databuffer UI has no way of knowing this up front.)

## 4. How can I check if a channel is recording?

You can see this on the "Channel info" screen.

**Please note:** This information is not available from every data provider.

## 5. What does 'query expansion' mean?

Databuffer UI will request data for the time range between _start_ and _end_, such that `start <= t <= end`. Also, the horizontal axis (t axis) will be scaled to match _start_ and _end_.

If the channel you query does not change very frequently (e.g. it monitors a value that is set manually from an operator panel), the line plot may have considerable gaps towards the left and right.

The _query expansion_ feature will include, if possible, 1 datapoint on each side, so that the lines of the plot can connect all the way to the edges.

See also: [How to extend the query range](./howtos/query_expansion.md)

## 6. Why is the correlation plot empty?

In order to correlate two channels, the datapoints must have the exact same time stamp. Otherwise no matches can be found.

## 7. Why can I not correlate two channels?

Correlation is only possible for channels that meet these criteria:

- Data type must be numeric
- Data shape must be scalar
