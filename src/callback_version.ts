const axios = require('axios');
const cheerio = require('cheerio');
import { url } from 'inspector';
import * as path from 'path';
const fs = require('fs');

 
async function scrapeUrl(page_url, callback) {

    const { data } = await axios.get(page_url);
    const $ = cheerio.load(data);

    const scrapedData = [];
    console.log('start: ', page_url)
     
    $('.search_result_link').each((i, elem) => {      
        const $elem = $(elem);  // each does not return html elem so I have to transform it
        const arrayElem = $elem.text().split(' ');
        const text = $elem.text().replace(arrayElem[0] + ' ', '');
        scrapedData.push({
            code: arrayElem[0],
            preferredName: text
        });
    });
    callback(scrapedData);
}


function getData(jsonIn, callback) {

    const jsonOut = [];

    for (let i = 0; i < jsonIn.length; i++) {
        console.log(jsonIn[i].searchUrl)
        scrapeUrl(jsonIn[i].searchUrl, (data) => {
            jsonOut.push(
                {
                    ...jsonIn[i],
                    scrapedData: data
                }
            )
            if (i == jsonIn.length - 1) {
             // dont know how to wait for the end of asynchronous for loop so I set an artificial Timeout, better idea?
                setTimeout( () => {callback(jsonOut)}, 50000)
            }
        })
    }
    
}


const fileIn = fs.readFileSync(path.join(__dirname, '..', 'json', 'searchUrl.json'), 'utf-8');
const jsonIn = JSON.parse(fileIn);

getData(jsonIn, (jsonOut) => {
    console.log('SAVING')
    console.log(`saved ${jsonOut.length} elements`)
    const fileOut = JSON.stringify(jsonOut, null, 2);
    fs.writeFileSync(path.join(__dirname, '..', 'json', 'scrapedData.json'), fileOut);
})
