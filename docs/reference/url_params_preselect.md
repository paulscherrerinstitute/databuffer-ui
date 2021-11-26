# URL parameters for `/preselect`

You can start _databuffer UI_ with a preconfigured plot using the `/preselect` URL. You'll need to specify all the configuration (i.e. which channels to plot and what time range) using the query string part of the URL. If you are not familiar with URL query strings and URL encoding values, you can read about it in the topic guide on [working with URL query strings](../topics/query_strings.md).

Parameters are listed in alphabetical order.

## c1 ... c16

You can specify up to 16 channels in parameters `c1` through `c16`. You have to provide a channel using the full channel ID, i.e. `${backend}/${name}`.

Examples:

| Backend              | Channel                        | Parameter value                                         |
| -------------------- | ------------------------------ | ------------------------------------------------------- |
| sf-archiverappliance | SINEG01-CMON-DIA0091:FAN-SPEED | sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED |
| proscan-archive      | MMAC2:STR:2                    | proscan-archive%2FMMAC2%3ASTR%3A2                       |

## duration

Duration of the plot in **milliseconds**.

Setting duration will will implicitly set [endTime](#endTime) to "now" and calculate [startTime](#startTime) by subtracting duration from [endTime](#endTime).

**Note:** You **shouldn't mix** the duration and [startTime](#startTime) or [endTime](#endTime) parameters. If parameters [startTime](#startTime) or [endTime](#endTime) are present, they will **take precedence** and override the values calculated from duration.

Examples:

| Example             | Parameter value |
| ------------------- | --------------- |
| The last 10 minutes | `600000`        |
| The last 2 hours    | `7200000`       |

## endTime

End time of the plot as an absolute timestamp in one of those formats:

- A **number value** defining the **milliseconds** elapsed since `1970-01-01T00:00:00.000Z` (UTC).
- A **string value** holding a **ISO8601 time string**, e.g. `2020-04-28T12:10:32.048+02:00`.

Examples:

| Example                                      | Parameter value                 |
| -------------------------------------------- | ------------------------------- |
| 10 minutes past noon on April 28th 2020 CEST | `2020-04-28T12:10:00.000+02:00` |
| 10 minutes past noon on April 28th 2020 CEST | `1588068600000`                 |

## l1 ... l16

You can specify custom labels for channels `c1` through `c16`. The index number of the label must match the index number of the channel. E.g. `l3` will be the label for channel `c3`.

The default label for any channel is the channel's name.

| Example                       | Parameter value                             |
| ----------------------------- | ------------------------------------------- |
| Kühlwassertemperatur Rücklauf | `K%C3%BChlwassertemperatur%20R%C3%BCcklauf` |

## max1 ... max16

You can specify the Y axis maximum for channels `c1` through `c16`. The index number of the label must match the index number of the channel. E.g. `max3` will be the label for channel `c3`.

The default for any channel is to determine the maximum automaticaly.

## min1 ... min16

You can specify the Y axis minimum for channels `c1` through `c16`. The index number of the label must match the index number of the channel. E.g. `min3` will be the label for channel `c3`.

The default for any channel is to determine the minimum automaticaly.

## plotVariation

The variation of plot to be used. Only specific constant values are supported:

| Constant         | meaning                                                |
| ---------------- | ------------------------------------------------------ |
| `separate-axes`  | Every channel is plotted on its own Y axis. (Default.) |
| `single-axis`    | All channels are plotted on a single Y axis.           |
| `separate-plots` | Every channel is plotted on its own plot .             |

Any other value is being ignored and results in using the default.

## queryExpansion

Enable query expansion by setting to `1`. With query expansion enabled, the query range will be extended to include 1 data point before the start time, and 1 data point after the end time if these data points exist. This effectively connects the line plot to the left and right edges of the chart in case of sparse data points.

Examples:

| Example                         | meaning                     |
| ------------------------------- | --------------------------- |
| `1`                             | query expansion is enabled  |
| any other value, or not present | query expansion is disabled |

## startTime

Start time of the plot as an absolute timestamp in one of those formats:

- A **number value** defining the **milliseconds** elapsed since `1970-01-01T00:00:00.000Z` (UTC).
- A **string value** holding a **ISO8601 time string**, e.g. `2020-04-28T12:10:32.048+02:00`.

Examples: See [endTime](#endtime).

## title

The title of the plot as a string.

| Example                           | Parameter value                              |
| --------------------------------- | -------------------------------------------- |
| Kühlwassertemperatur letzte Woche | `K%C3%BChlwassertemperatur%20letzte%20Woche` |

## y1 ... y16

You can specify the Y axis type for channels `c1` through `c16`. The index number of the axis type must match the index number of the channel. E.g. `y3` will be the label for channel `3`.

| Constant      | meaning                                  |
| ------------- | ---------------------------------------- |
| `linear`      | The Y axis uses linear steps. (Default.) |
| `logarithmic` | The Y axis uses logarithmic steps.       |

Any other value is being ignored and results in using the default.
