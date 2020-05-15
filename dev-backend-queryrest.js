// development backend substituting for query-rest
// run with: npm run dev-backend:queryrest

const http = require('http')

const PORT = 8080

// FAKE DATA BASIS
const BACKENDS = ['sf-dbuf', 'sf-arch', 'sf-img']
const TYPES = ['int8', 'uint16', 'float64']
const SHAPES = [[1], [16], [8, 8]]
const UNITS = [undefined, 'A', 'W', 'V', 'Pa']

const randomPick = function (list) {
	const i = Math.floor(list.length * Math.random())
	return list[i]
}

const randomString = function (len) {
	const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
	const result = []
	for (let i = len; i > 0; i--) {
		result.push(randomPick(ALPHABET))
	}
	return result.join('')
}

// some fake data sets, just so we get different results every now and then
const makeChannelConfigItem = function () {
	return {
		source: 'fake://haha-i-fooled-you.example.org/',
		backend: randomPick(BACKENDS),
		name: 'channel-' + randomString(4),
		type: randomPick(TYPES),
		shape: randomPick(SHAPES),
		unit: randomPick(UNITS),
		description:
			Math.random() >= 0.5
				? 'description: ' + randomString(5) + ' ' + randomString(8)
				: undefined,
	}
}

const fakeChannelConfigData = function () {
	const channels = []
	const nElems = Math.round(500 * Math.random())
	for (let i = nElems; i > 0; i--) {
		channels.push(makeChannelConfigItem())
	}
	const backends = [...new Set(channels.map(x => x.backend))]
	const results = backends.map(be => ({
		backend: be,
		channels: channels.filter(ch => ch.backend === be),
	}))
	return results
}

const fakeQueryDataForChannel = function (reqData) {
	const offset = Math.floor(Math.random() * 100)
	const jitter = Math.floor(Math.random() * 20)
	const fakeValue = () => offset + Math.random() * jitter
	const nElems = Math.round(750 * Math.random())
	const stepSize =
		(reqData.range.endSeconds - reqData.range.startSeconds) / nElems
	let t = reqData.range.startSeconds
	const result = []
	t += Math.random() * stepSize * 2
	while (t < reqData.range.endSeconds) {
		const dataPoint = {}
		for (const k of reqData.eventFields) {
			dataPoint[k] =
				k === 'globalMillis'
					? t * 1000
					: k === 'pulseId'
					? Math.floor(t / 100000) * 100
					: k === 'value'
					? { max: fakeValue(), min: fakeValue(), mean: fakeValue() }
					: k === 'eventCount'
					? 1
					: Math.random()
		}
		result.push(dataPoint)
		t += Math.random() * stepSize * 2
	}
	return result
}

const fakeQueryData = function (reqData) {
	console.log('Faking query data for request:')
	console.log(reqData)
	console.log('--------------------')
	const result = reqData.channels.map(ch => ({
		channel: ch,
		data: fakeQueryDataForChannel(reqData),
	}))
	console.log(result)
	return result
}

const requestListener = function (req, res) {
	// faking CORS headers
	// just assume every OPTIONS request is a CORS preflight request
	if (req.method === 'OPTIONS') {
		res.writeHead(200, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': '*',
		})
		res.end()
		return
	} else if (req.url === '/channels/config') {
		const data = fakeChannelConfigData()
		res.writeHead(200, {
			'Content-type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		})
		res.end(JSON.stringify(data))
		return
	} else if (req.url === '/query') {
		const requestData = []
		req.on('data', chunk => {
			requestData.push(chunk)
		})
		req.on('end', () => {
			const data = fakeQueryData(JSON.parse(requestData))
			res.writeHead(200, {
				'Content-type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			})
			res.end(JSON.stringify(data))
		})
	} else {
		res.writeHead(404, {
			'Content-type': 'text/plain',
			'Access-Control-Allow-Origin': '*',
		})
		res.end('Not found')
	}
}

const server = http.createServer(requestListener)
console.log(`Dev server for query-rest API. Listening on port ${PORT}...`)
console.log('Press Ctrl-C to stop.')
server.listen(PORT)
