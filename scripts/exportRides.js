const { MongoClient } = require("mongodb");
const fs = require("fs/promises");
require("dotenv").config();

const mongoUrl = process.env.MONGO_URL;
const exportsDir = "./scripts/exports";

const client = new MongoClient(mongoUrl, {
    useUnifiedTopology: true
});

async function main() {
    await client.connect();
    console.log("Connected");
    const db = client.db();

    const rideCollection = db.collection("rides");
    const rides = await rideCollection.aggregate([
        { $project: { route: 1 } }
    ]).toArray();

    console.log(`Retrieved ${rides.length} rides`);
    
    await fs.access(exportsDir)
        .then(() => fs.rmdir(exportsDir, { recursive: true }))
        .finally(() => fs.mkdir(exportsDir));

    for (const ride of rides) {
        let str = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?><gpx version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">';
        for (const [point, index] of ride.route.map((r, i) => [r, i])) {
            str += `<wpt lat="${point[0]}" lon="${point[1]}"><name>Point ${index+1}</name></wpt>`;
        }
        str += "</gpx>";
        await fs.writeFile(`${exportsDir}/${ride._id}.gpx`, str);
    }

    console.log("Finished");

}

main().finally(() => client.close());