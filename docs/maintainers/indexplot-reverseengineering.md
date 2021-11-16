# Reverse Engineering for the index plot

This documentation is the protocol of reverse engineering the details of how the index plot feature works in Data UI v2.7.
You can [check out the related issue on GitHub](https://github.com/paulscherrerinstitute/databuffer-ui/issues/19).

## Step 1: Overview plot

1.  Open https://ui-data-api.psi.ch/
2.  Search for `S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I`, select the channel, and click "Plot"
3.  Set date range
    - Start: `2021-03-01 00:00:00.000`
    - End: `2021-05-01 00:00:00.000`
4.  Click "Plot"

### Query 1

#### Request

```json
{
	"channels": [
		{
			"backend": "sf-archiverappliance",
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I"
		}
	],
	"eventFields": [
		"value",
		"globalMillis",
		"pulseId",
		"globalDate",
		"shape",
		"eventCount"
	],
	"range": {
		"startExpansion": true,
		"startDate": "2021-03-01T00:00:00.000+01:00",
		"endDate": "2021-05-01T00:00:00.000+02:00",
		"endExpansion": true
	},
	"aggregation": { "nrOfBins": 512 }
}
```

#### Response

```json
[
	{
		"channel": {
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I",
			"backend": "sf-archiverappliance"
		},
		"data": [
			{
				"shape": [1],
				"value": {
					"min": -26000.0,
					"max": 26000.0,
					"mean": 6893.5546875000055
				},
				"globalMillis": 1613563802558,
				"eventCount": 1,
				"globalDate": "2021-02-17T13:10:02.558044966+01:00",
				"pulseId": -1
			},
			/* ... skip some entries ... */
			{
				"shape": [1],
				"value": {
					"min": -26000.0,
					"max": 26000.0,
					"mean": 6893.5546875000055
				},
				"globalMillis": 1618581658735,
				"eventCount": 2,
				"globalDate": "2021-04-16T16:00:58.735193272+02:00",
				"pulseId": -1
			},
			{
				"shape": [1],
				"value": {
					"min": -26000.0,
					"max": 26000.0,
					"mean": 6893.5546875000055
				},
				"globalMillis": 1618821691901,
				"eventCount": 1,
				"globalDate": "2021-04-19T10:41:31.901369700+02:00",
				"pulseId": -1
			}
		]
	}
]
```

### Query 2

#### Request

```json
{
	"channels": [
		{
			"backend": "sf-archiverappliance",
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I"
		}
	],
	"eventFields": [
		"value",
		"globalMillis",
		"pulseId",
		"globalDate",
		"shape",
		"eventCount"
	],
	"range": {
		"startExpansion": true,
		"startDate": "2021-05-01T00:00:00.000+02:00",
		"endDate": "2021-05-01T00:00:00.001+02:00",
		"endExpansion": true
	}
}
```

**NOTE:**

- startDate = end of time range
- endDate = startDate + 1ms

#### Response

```json
[
	{
		"channel": {
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I",
			"backend": "sf-archiverappliance"
		},
		"data": [
			{
				"shape": [2048],
				"globalMillis": 1618821691901,
				"eventCount": 1,
				"pulseId": -1,
				"value": [
					/* 2048 numbers */
				],
				"globalDate": "2021-04-19T10:41:31.901369700+02:00"
			}
		]
	}
]
```

## Step 2: Index plot

1.  Zoom in on the (few) data points between 2021-03 and 2021-05
2.  Find data point at "2021-04-16 16:00" by hovering the mouse pointer over the events
3.  Click on that data point

### Query 1

#### Request

```json
{
	"channels": [
		{
			"backend": "sf-archiverappliance",
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I"
		}
	],
	"eventFields": [
		"globalMillis",
		"pulseId",
		"globalDate",
		"shape",
		"eventCount"
	],
	"range": {
		"startDate": "2021-04-16T16:00:58.735+02:00",
		"endDate": "2021-04-19T10:41:31.901+02:00"
	}
}
```

**NOTE:**

- The `startDate` is the time of the clicked on data point
- The `endDate` is the time of the following data point

#### Response

```json
[
	{
		"channel": {
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I",
			"backend": "sf-archiverappliance"
		},
		"data": [
			{
				"shape": [2048],
				"globalMillis": 1618581658735,
				"eventCount": 1,
				"pulseId": -1,
				"globalDate": "2021-04-16T16:00:58.735193272+02:00"
			},
			{
				"shape": [2048],
				"globalMillis": 1618584350110,
				"eventCount": 1,
				"pulseId": -1,
				"globalDate": "2021-04-16T16:45:50.110968071+02:00"
			}
		]
	}
]
```

**NOTE:**

- number of bins = size of `data` array in response
- response contains the time stamps for the individual bins

### Query 2

#### Request

```json
{
	"channels": [
		{
			"backend": "sf-archiverappliance",
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I"
		}
	],
	"eventFields": [
		"globalMillis",
		"globalDate",
		"value",
		"pulseId",
		"shape",
		"eventCount"
	],
	"range": {
		"startDate": "2021-04-16T16:00:58.735+02:00",
		"endDate": "2021-04-19T10:41:31.901+02:00"
	},
	"aggregation": {
		"aggregations": ["mean"],
		"extrema": ["minValue", "maxValue"],
		"aggregationType": "index",
		"nrOfBins": 1
	}
}
```

#### Response

```json
[
	{
		"channel": {
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I",
			"backend": "sf-archiverappliance"
		},
		"data": [
			{
				"shape": [2048],
				"extrema": [
					{
						"minValue": {
							"pulseId": -1,
							"eventCount": 2,
							"value": 0.0,
							"globalMillis": 1618581658735,
							"globalDate": "2021-04-16T16:00:58.735193272+02:00"
						},
						"maxValue": {
							"pulseId": -1,
							"eventCount": 2,
							"value": 0.0,
							"globalMillis": 1618581658735,
							"globalDate": "2021-04-16T16:00:58.735193272+02:00"
						}
					},
					/* ... 2046 entries skipped ... */
					{
						"minValue": {
							"pulseId": -1,
							"eventCount": 2,
							"value": 0.0,
							"globalMillis": 1618581658735,
							"globalDate": "2021-04-16T16:00:58.735193272+02:00"
						},
						"maxValue": {
							"pulseId": -1,
							"eventCount": 2,
							"value": 0.0,
							"globalMillis": 1618581658735,
							"globalDate": "2021-04-16T16:00:58.735193272+02:00"
						}
					}
				],
				"value": [
					{ "mean": 0.0 },
					/* ... 2046 entries skipped ... */
					{ "mean": 0.0 }
				],
				"globalMillis": 1618581658735,
				"eventCount": 2,
				"globalDate": "2021-04-16T16:00:58.735193272+02:00",
				"pulseId": -1
			}
		]
	}
]
```

### Query 3

#### Request

```json
{
	"channels": [
		{
			"backend": "sf-archiverappliance",
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I"
		}
	],
	"eventFields": [
		"globalMillis",
		"globalDate",
		"value",
		"pulseId",
		"shape",
		"eventCount"
	],
	"range": {
		"startDate": "2021-04-16T16:00:58.735+02:00",
		"endDate": "2021-04-16T16:00:58.736+02:00"
	}
}
```

**NOTE:**

- The `startDate` is the time of the clicked on data point = timestamp of first bin in response of query 1 in this step
- `endDate = startDate + 1` (1ms later)

#### Response

```json
[
	{
		"channel": {
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I",
			"backend": "sf-archiverappliance"
		},
		"data": [
			{
				"shape": [2048],
				"globalMillis": 1618581658735,
				"eventCount": 1,
				"pulseId": -1,
				"value": [
					/* 2048 numbers */
				],
				"globalDate": "2021-04-16T16:00:58.735193272+02:00"
			}
		]
	}
]
```

## Step 3: Move inside bin

1. Click button "Next"

### Query 1

#### Request

```json
{
	"channels": [
		{
			"backend": "sf-archiverappliance",
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I"
		}
	],
	"eventFields": [
		"globalMillis",
		"globalDate",
		"value",
		"pulseId",
		"shape",
		"eventCount"
	],
	"range": {
		"startDate": "2021-04-16T16:45:50.110+02:00",
		"endDate": "2021-04-16T16:45:50.111+02:00"
	}
}
```

**NOTE:**

- The `startDate` is the timestamp of the second bin in the response of query 1 in this step
- `endDate = startDate + 1` (1ms later)

#### Response

```json
[
	{
		"channel": {
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I",
			"backend": "sf-archiverappliance"
		},
		"data": [
			{
				"shape": [2048],
				"globalMillis": 1618584350110,
				"eventCount": 1,
				"pulseId": -1,
				"value": [
					/* 2048 numbers */
				],
				"globalDate": "2021-04-16T16:45:50.110968071+02:00"
			}
		]
	}
]
```

## Step 4: Move to next bin

1. Click next data point in overview plot (at "2021-04-19 10:41")

### Query 1

#### Request

```json
{
	"channels": [
		{
			"backend": "sf-archiverappliance",
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I"
		}
	],
	"eventFields": [
		"globalMillis",
		"pulseId",
		"globalDate",
		"shape",
		"eventCount"
	],
	"range": {
		"startDate": "2021-04-19T10:41:31.901+02:00",
		"endDate": "2021-11-12T11:03:45.182+01:00"
	}
}
```

#### Response

```json
[
	{
		"channel": {
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I",
			"backend": "sf-archiverappliance"
		},
		"data": [
			{
				"shape": [2048],
				"globalMillis": 1618821691901,
				"eventCount": 1,
				"pulseId": -1,
				"globalDate": "2021-04-19T10:41:31.901369700+02:00"
			}
		]
	}
]
```

### Query 2

#### Request

```json
{
	"channels": [
		{
			"backend": "sf-archiverappliance",
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I"
		}
	],
	"eventFields": [
		"globalMillis",
		"globalDate",
		"value",
		"pulseId",
		"shape",
		"eventCount"
	],
	"range": {
		"startDate": "2021-04-19T10:41:31.901+02:00",
		"endDate": "2021-11-12T11:03:45.182+01:00"
	},
	"aggregation": {
		"aggregations": ["mean"],
		"extrema": ["minValue", "maxValue"],
		"aggregationType": "index",
		"nrOfBins": 1
	}
}
```

#### Response

```json
[
	{
		"channel": {
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I",
			"backend": "sf-archiverappliance"
		},
		"data": [
			{
				"shape": [2048],
				"extrema": [
					{
						"minValue": {
							"pulseId": -1,
							"eventCount": 1,
							"value": 0.0,
							"globalMillis": 1618821691901,
							"globalDate": "2021-04-19T10:41:31.901369700+02:00"
						},
						"maxValue": {
							"pulseId": -1,
							"eventCount": 1,
							"value": 0.0,
							"globalMillis": 1618821691901,
							"globalDate": "2021-04-19T10:41:31.901369700+02:00"
						}
					},
					/* ... 2046 entries skipped ... */
					{
						"minValue": {
							"pulseId": -1,
							"eventCount": 1,
							"value": 0.0,
							"globalMillis": 1618821691901,
							"globalDate": "2021-04-19T10:41:31.901369700+02:00"
						},
						"maxValue": {
							"pulseId": -1,
							"eventCount": 1,
							"value": 0.0,
							"globalMillis": 1618821691901,
							"globalDate": "2021-04-19T10:41:31.901369700+02:00"
						}
					}
				],
				"value": [
					{ "mean": 0.0 },
					/* ... 2046 entries skipped ... */
					{ "mean": 0.0 }
				],
				"globalMillis": 1618821691901,
				"eventCount": 1,
				"globalDate": "2021-04-19T10:41:31.901369700+02:00",
				"pulseId": -1
			}
		]
	}
]
```

### Query 3

#### Request

```json
{
	"channels": [
		{
			"backend": "sf-archiverappliance",
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I"
		}
	],
	"eventFields": [
		"globalMillis",
		"globalDate",
		"value",
		"pulseId",
		"shape",
		"eventCount"
	],
	"range": {
		"startDate": "2021-04-19T10:41:31.901+02:00",
		"endDate": "2021-04-19T10:41:31.902+02:00"
	}
}
```

#### Response

```json
[
	{
		"channel": {
			"name": "S10CB02-RHLA-JOBTBL:SET-USR-TABLE-I",
			"backend": "sf-archiverappliance"
		},
		"data": [
			{
				"shape": [2048],
				"globalMillis": 1618821691901,
				"eventCount": 1,
				"pulseId": -1,
				"value": [
					/* 2048 numbers */
				],
				"globalDate": "2021-04-19T10:41:31.901369700+02:00"
			}
		]
	}
]
```
