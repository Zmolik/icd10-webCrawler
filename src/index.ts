const axios = require('axios');
const cheerio = require('cheerio');
import * as path from 'path';
const fs = require('fs');


async function createUrl(fileName) {
    const fileIn = fs.readFileSync(path.join(__dirname, '..', 'json', fileName), 'utf-8');
    const jsonIn = JSON.parse(fileIn);

    const jsonOut = [];
    console.log('Start creating urls.')
    // MAIN LOOP OVER THE diagnosis-list.json
    for (let i = 0; i < jsonIn.length; i++) {    

        // creating url
        const array: string[] = jsonIn[i].name.split(' ');
        var url = `https://www.icd-code.de/suche/icd/recherche.html?sp=0&sp=S${array[0]}`
        array.forEach((elem, j) => {
            if (j > 0 && elem !== '/') {
                url = `${url}%20${elem}`
            }    
        })
        // console.log(array);
        // console.log(url);
        jsonOut.push(
            {
            ...jsonIn[i],
            searchUrl: url
            }
        )
        if (i == jsonIn.length - 1) {
            console.log(`Created ${jsonOut.length} urls.`)
            const fileOut = JSON.stringify(jsonOut, null, 2);
            fs.writeFileSync(path.join(__dirname, '..', 'json', 'searchUrl.json'), fileOut);
        }
       
    }
}

 
async function scrapeUrl(page_url, callback) {

    const { data } = await axios.get(page_url);
    const $ = cheerio.load(data);

    const scrapedData = [];
    console.log('scraping: ', page_url)
     
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


async function main(fileNameInput, fileNameOutput) {
    
    const fileIn = fs.readFileSync(path.join(__dirname, '..', 'json', fileNameInput), 'utf-8');
    const jsonIn = JSON.parse(fileIn);
    const jsonOut: any = [];

    console.log('Urls to scrape: ', jsonIn.length)

    for (let i = 1; i < jsonIn.length; i++) {
        try {
            // I would like to make asychronous loop, and after every elements in the loop are processed, I would like to save it to a file
            // But I don't know how to do it (other then using Timeout -> see callback_version.ts), any idea?
            await scrapeUrl(jsonIn[i].searchUrl, (data) => {
                jsonOut.push(
                    {
                        ...jsonIn[i],
                        scrapedData: data
                    }
                );
                if (i == jsonIn.length - 1) {
                    console.log(`Saved ${jsonOut.length} elements.`)
                    const fileOut = JSON.stringify(jsonOut, null, 2);
                    fs.writeFileSync(path.join(__dirname, '..', 'json', fileNameOutput), fileOut);
                }
            })
        } catch(e) {
            console.error(e);
        }
        
    }
 
}

async function checkData(fileName) {

    const fileIn = fs.readFileSync(path.join(__dirname, '..', 'json', fileName), 'utf-8');
    const jsonIn = JSON.parse(fileIn);

    let noCode = 0;
    jsonIn.forEach( (elem, i) => {
        if (elem.scrapedData.length == 0) {noCode++};
        if (i == jsonIn.length - 1) {
            console.log(`From ${jsonIn.length} elements, ${jsonIn.length - noCode} has at least one icd code, ${noCode} has no icd code.`)
        }
    })  
}


// createUrl('diagnosis-list.json')
// main('searchUrl.json', 'scrapedData.json');
// checkData('scrapedData.json')











