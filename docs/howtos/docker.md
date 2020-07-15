# How to run databuffer-ui with docker

We provide a docker image of _databuffer-ui_. This helps in testing different configurations locally, and it's a nice convenience for developers writing a custom backend for the data api service.

In this how-to guide you'll go through the steps of running the latest published (beta) version of the _databuffer-ui_ docker image. We'll configure it to send all data queries to http://localhost:8888 and dispatcher queries to http://localhost:9999, and make it available on your host on port 3000.

### Step 1: Create a directory to hold your configuration

You need to customize the configuration, otherwise all queries for data will go to localhost, like in the development setup. The configuration of _databuffer-ui_ comes from a JavaScript file, that is loaded and processed by the browser. The first step is to create a directory, where that file will be kept (on your host):

```sh
mkdir /tmp/databuffer-ui-config
```

### Step 2: Create the configuration file

Next, create file `/tmp/databuffer-ui-config/databuffer-ui.config.js` with the following contents:

```js
window.DatabufferUi = {
	QUERY_API: 'http://localhost:8888',
	DISPATCHER_API: 'http://localhost:9999',
}
```

Don't forget to save that file.

### Step 3: Get the latest docker image

```
docker pull docker.psi.ch:5000/databuffer-ui:latest
```

### Step 4: Run the image in a container

So, all that is left, is to run the image in a container, and make it use the configuration we want.

The image itself hosts the web application on port 80. As the declared goal in this how-to guide is to make it available on your host on port 3000, you need to publish port 80 from the container to port 3000 on your host. That is what the `-p 3000:80` does.

Also, the image will provide the configuartion file from `/app/config` directory, so you'll need to bind your local directory `/tmp/databuffer-ui-config` to that. This is what the `-v /tmp/databuffer-ui-config:/app/config` does.

Then, just for housekeeping we sprinkle in these parameters as well:

- `--rm` will remove the container after the process inside terminated.
- `-it` is shorthand for `-i -t`, which will run the container with an interactive terminal; i.e. you'll see the output on your terminal.

The final command then looks like this:

```
docker run --rm -it -p 3000:80 -v /tmp/databuffer-ui-config:/app/config docker.psi.ch:5000/databuffer-ui
```
