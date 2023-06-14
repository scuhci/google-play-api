const { app, BrowserWindow, ipcMain, session } = require("electron");
const gplay = require("google-play-scraper");
const path = require("path");
import("file-metadata").then(fileMetadata => {
	// Use the fileMetadata module here

	// Clear all extended attributes from the app executable
	if (process.platform === 'darwin') {
		const appPath = app.getAppPath();
		const appExecutablePath = path.join(appPath, 'Contents', 'MacOS', app.getName());

		fileMetadata.clearExtendedAttributes(appExecutablePath, (error, attrs) => {
			if (error) {
				console.error('Error clearing extended attributes:', error);
				return;
			}

			attrs.forEach((attr) => {
				console.log(`Cleared extended attribute: ${attr}`);
			});

			console.log('All extended attributes cleared successfully.');
		});
	} else {
		console.log('Extended attribute clearing is only supported on macOS.');
	}
  }).catch(
	// Handle errors that may occur when importing the fileMetadata module
	(error) => {
		console.error('Error importing fileMetadata module:', error);
	}
	  );

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      // Set the Content Security Policy for the renderer process
      // Only allow content to be loaded from the same origin
      // Disable inline script and eval functions
      // Enable remote module (use with caution)
      // See https://www.electronjs.org/docs/tutorial/security#6-enable-context-isolation-for-remote-content
      // for more information about remote module and context isolation 
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      contentSecurityPolicy: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'"
    }
  });

  mainWindow.loadFile(__dirname + "/index.html");

  // Make it so the user can't use dev tools
  mainWindow.webContents.on("devtools-opened", () => {
    mainWindow.webContents.closeDevTools();
  });

  // Maximize the screen
  mainWindow.maximize();

  mainWindow.setMenuBarVisibility(false); // Hide the menu bar
}

app.whenReady().then(() => { 
  createWindow();

  app.on("ready", () => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const newHeaders = Object.assign({}, details.responseHeaders, {
        'Content-Security-Policy': ["default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'"],
      });
      callback({
        responseHeaders: newHeaders
      });
    });
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

/* App Search */ 
ipcMain.on('search', async (event, searchTerm) => {
	try {
		const apps = await gplay.search({
			term: searchTerm,
			num: 20,
		});

		if (apps.length === 0) {
			console.log(`No apps found for term: ${searchTerm}`);
			event.sender.send('search-results', '[]', searchTerm);
			return;
		}

		const results = await searchTermMore(searchTerm); // time complexity: O(n^2) where n is the number of apps returned by the search
		event.sender.send('search-results', JSON.stringify(results), searchTerm); 
	} catch (err) {
		event.sender.send('app-error', err.message);
	}
});

/* App Suggest */
ipcMain.on('suggest', async (event, searchTerm) => {
	try {
		const results = await gplay.suggest({term: searchTerm});
		event.sender.send('suggest-results', JSON.stringify(results), searchTerm);
	} catch (err) {
		event.sender.send('app-error', err.message);
	}
});

/* Similar Apps */
ipcMain.on('get-similar-apps', async (event, appId) => {
	try {
		const similarApps = await gplay.similar({ appId: appId, lang: 'en', country: 'us' });
		 
		event.sender.send('similar-apps-results', similarApps, appId);
	} catch (err) {
		event.sender.send('app-error', err.message);
	}
}); 

  /* App List */
  ipcMain.on('get-app-list', async (event, sortByCollection, sortByCategory, sortByAge ) => { 
	try {
		const optionsMap = {
			sortByCollection: {
			  TOP_PAID: gplay.sort.TOP_PAID,
			  GROSSING: gplay.sort.GROSSING,
			  default: gplay.sort.TOP_FREE
			},
			sortByCategory: {
				OVERALL: gplay.category.OVERALL,
				APPLICATION: gplay.category.APPLICATION,
				ANDROID_WEAR: gplay.category.ANDROID_WEAR,
				ART_AND_DESIGN: gplay.category.ART_AND_DESIGN,
				AUTO_AND_VEHICLES: gplay.category.AUTO_AND_VEHICLES,
				BEAUTY: gplay.category.BEAUTY,
				BOOKS_AND_REFERENCE: gplay.category.BOOKS_AND_REFERENCE,
				BUSINESS: gplay.category.BUSINESS,
				COMICS: gplay.category.COMICS,
				COMMUNICATION: gplay.category.COMMUNICATION,
				DATING: gplay.category.DATING,
				EDUCATION: gplay.category.EDUCATION,
				ENTERTAINMENT: gplay.category.ENTERTAINMENT,
				EVENTS: gplay.category.EVENTS,
				FINANCE: gplay.category.FINANCE,
				FOOD_AND_DRINK: gplay.category.FOOD_AND_DRINK,
				HEALTH_AND_FITNESS: gplay.category.HEALTH_AND_FITNESS,
				HOUSE_AND_HOME: gplay.category.HOUSE_AND_HOME,
				LIBRARIES_AND_DEMO: gplay.category.LIBRARIES_AND_DEMO,
				LIFESTYLE: gplay.category.LIFESTYLE,
				MAPS_AND_NAVIGATION: gplay.category.MAPS_AND_NAVIGATION,
				MEDICAL: gplay.category.MEDICAL,
				MUSIC_AND_AUDIO: gplay.category.MUSIC_AND_AUDIO,
				NEWS_AND_MAGAZINES: gplay.category.NEWS_AND_MAGAZINES,
				PARENTING: gplay.category.PARENTING,
				PERSONALIZATION: gplay.category.PERSONALIZATION,
				PHOTOGRAPHY: gplay.category.PHOTOGRAPHY,
				PRODUCTIVITY: gplay.category.PRODUCTIVITY,
				SHOPPING: gplay.category.SHOPPING,
				SOCIAL: gplay.category.SOCIAL,
				SPORTS: gplay.category.SPORTS,
				TOOLS: gplay.category.TOOLS,
				TRAVEL_AND_LOCAL: gplay.category.TRAVEL_AND_LOCAL,
				VIDEO_PLAYERS: gplay.category.VIDEO_PLAYERS,
				WEATHER: gplay.category.WEATHER,
				GAME: gplay.category.GAME,
				GAME_ACTION: gplay.category.GAME_ACTION,
				GAME_ADVENTURE: gplay.category.GAME_ADVENTURE,
				GAME_ARCADE: gplay.category.GAME_ARCADE,
				GAME_BOARD: gplay.category.GAME_BOARD,
				GAME_CARD: gplay.category.GAME_CARD,
				GAME_CASINO: gplay.category.GAME_CASINO,
				GAME_CASUAL: gplay.category.GAME_CASUAL,
				GAME_EDUCATIONAL: gplay.category.GAME_EDUCATIONAL,
				GAME_MUSIC: gplay.category.GAME_MUSIC,
				GAME_PUZZLE: gplay.category.GAME_PUZZLE,
				GAME_RACING: gplay.category.GAME_RACING,
				GAME_ROLE_PLAYING: gplay.category.GAME_ROLE_PLAYING,
				GAME_SIMULATION: gplay.category.GAME_SIMULATION,
				GAME_SPORTS: gplay.category.GAME_SPORTS,
				GAME_STRATEGY: gplay.category.GAME_STRATEGY,
				GAME_TRIVIA: gplay.category.GAME_TRIVIA,
				GAME_WORD: gplay.category.GAME_WORD,
				FAMILY: gplay.category.FAMILY,
				FAMILY_ACTION: gplay.category.FAMILY_ACTION,
				FAMILY_BRAIN_GAMES: gplay.category.FAMILY_BRAIN_GAMES,
				FAMILY_CREATE: gplay.category.FAMILY_CREATE,
				FAMILY_EDUCATION: gplay.category.FAMILY_EDUCATION,
				FAMILY_MUSIC_VIDEO: gplay.category.FAMILY_MUSIC_VIDEO,
				FAMILY_PRETEND: gplay.category.FAMILY_PRETEND
			  },			  
			sortByAge: {
			  FIVE_UNDER: gplay.age.FIVE_UNDER,
			  SIX_EIGHT: gplay.age.SIX_EIGHT,
			  NINE_UP: gplay.age.NINE_UP
			}
		  };
		  
		  const collectionOptions = optionsMap.sortByCollection[sortByCollection] || optionsMap.sortByCollection.default;
		  const categoryOptions = optionsMap.sortByCategory[sortByCategory] || gplay.category.APPLICATION;
		  const ageOptions = optionsMap.sortByAge[sortByAge];
		   
		const appList = await gplay.list({
			collection: collectionOptions,
			category: categoryOptions,
			age: ageOptions,
			num: 200,
			lang: 'en',
			country: 'us'
		});

		event.sender.send('app-list-results', appList, sortByCollection, sortByCategory, sortByAge);
		  
	} catch (err) {
		event.sender.send('app-error', err.message);
	}
});

/* Developer */
ipcMain.on('get-developer', async (event, devId) => {
	try {
	  const options = {
		devId: devId,
		lang: 'en',
		country: 'us'
	  };
  
	  const developer = await gplay.developer(options);
  
	  if (developer.length === 0) {
		event.sender.send('app-error', 'Developer information not found for app');
		return;
	  }
  
	  event.sender.send('developer-results', developer, devId);
	} catch (err) {
		event.sender.send('app-error', err.message);
	}
  });

/* Data Safety */
ipcMain.on('get-data-safety', async (event, appId) => {
	try { 
	  const dataSafety = await gplay.datasafety({ appId: appId, lang: 'en', country: 'us' }); 
	  if (
		!dataSafety.sharedData.length &&
		!dataSafety.collectedData.length &&
		!dataSafety.securityPractices.length &&
		dataSafety.privacyPolicyUrl === undefined
	  ) {
		event.sender.send('app-error', 'Data safety information not found for app');
		return;
	  }
	  
	  event.sender.send('data-safety-results', dataSafety, appId);
	} catch (err) {
	  event.sender.send('app-error', err.message);
	}
  });  
  
  /* App Permissions */
  ipcMain.on('get-app-permissions', async (event, appId) => {
	try {
	  const permissions = await gplay.permissions({ appId: appId, lang: 'en', country: 'us' }); 
	  if (permissions.length === 0) {
		// Display an error tooltip when the app has no permissions
		event.sender.send('app-error', 'Permission information not found for app');
		return;
	  }
	  
	  event.sender.send('permission-results', permissions, appId); 
	} catch (err) {
		console.error("Error generating permissions for app:", appId, err);
		event.sender.send('app-error', err.message);
	}
});
 
/* App reviews */ 

ipcMain.on('get-reviews', async (event, appId, sortBy) => { // Time Complexity: O(N / P) where N is the number of reviews and P is the number of reviews per page
	const sortOption = (() => {
	  switch(sortBy) {
		case "RATING": return gplay.sort.RATING;
		case "HELPFULNESS": return gplay.sort.HELPFULNESS;
		default: return gplay.sort.NEWEST;
	  }
	})();
	
	const options = {
	  appId: appId, 
	  sort: sortOption,
	  lang: 'en',
	  country: 'us', 
	  paginate: true,
	};
	
	let reviews = []; // initialize reviews as an empty array
	
	try {
	  let nextToken; // initialize nextToken as undefined
	  
	  do {
		if (nextToken) { // if nextToken is defined, add it to the options object
		  options.nextPaginationToken = nextToken;
		}
		
		const result = await gplay.reviews(options);
		const newData = result.data || []; // ensure newData is an array
		
		// if no new data is received, exit the loop
		if (!newData.length) {
		  break;
		}
		
		reviews = reviews.concat(newData); // concatenate the new data to the reviews array
		nextToken = result.nextPaginationToken; // set nextToken to the token for the next page
	  } while (nextToken);
	  
	  if (!reviews.length) {
		event.sender.send('app-error', 'Review information not found for app');
		return;
	  } 
	  
	  console.log(`Received ${reviews.length} reviews for app: ${appId}`);
	  
	  event.sender.send('reviews-results', reviews, appId);
	} catch (err) {
	  console.error("Error occurred while getting reviews:", err);
	  event.sender.send('app-error', err.message);
	}
  });  

async function searchTermMore(term, arr = {}) { // time complexity: O(n^2) where n is the number of apps returned by the search
	if (!term) {
		console.error("Error: search term is undefined");
		return;
	}

	let total = 0;
	let i = 0;
	let count = 0;

	console.log("searchTermMore called with term:", term);

	try {
		const apps = await gplay.search({
			term: term,
			num: 20,
		});

		total = apps.length; 

		if (apps.length === 0) {
			console.log(`No apps found for term: ${term}`);
			return Object.values(arr);
		}

		await Promise.all(
			apps.map(async (app) => {
				try {
					const apps2 = await gplay.search({
						term: app.title,
						num: 100,
					}); 

					for (let app of apps2) {
						if (!(app.appId in arr)) {
							arr[app.appId] = app;
							i++;
						}
					}
				} catch (err) {
					console.error(`Error occurred during subterm search for ${app.title}:`, err);
				}
				count++;
			})
		);

		if (count < total) {
			console.log(`Not all apps for term: ${term} have been processed, calling searchTermMore again`);
			return await searchTermMore(term, arr);
		} else { 
			return Object.values(arr);
		}
	} catch (err) {
		console.error("Error occurred during search:", err);
		throw err;
	}
}
