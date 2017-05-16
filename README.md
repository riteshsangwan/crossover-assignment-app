# Assignment App

This app facilitates proper communication between blood donors and the persons who are in need of blood donors.

A user can visit the site, find his/her location and click on the map. The click should open a popup, user should fill the form completely and submit.

Once the form is submitted donor posting is created and will be visible to all the users in realtime.

This application is bootstrapped using [create-react-app](https://github.com/facebookincubator/create-react-app) and support has been added for [arcgis](https://arcgis.com) javascript 4.3 API to load and display the donor postings.

### Features

- The postings are updated in realtime using sockets connections
- Only donors in the viewable region of the map are loaded. Once the user drags or resize the map the donor markers are updated.
- The update to the feature layer is batched and the feature layer is updated once every a second. This gives great performance boost.


### Configuration

The app configuration is handled in `src/config/index.js` file.

|  Name   |   Description |  Value  |
|:-:  |:-:  |:-:  |
|  api.baseUrl  | The base path of the api services   | http://localhost:4000/api/v1    |
| socket.url    | The socket url    | http://localhost:4000   |

The server should be running at port `4000` and on host `localhost` for this configuration to work properly.

### How to run

- Install node dependencies using `npm install`
- Start the server using `npm run start`