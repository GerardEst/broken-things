import { parse } from 'node-html-parser';
import { config } from './config.js'
import chalk from 'chalk';

const baseUrl = 'https://'+config.baseUrl

const linksToVisit = new Map()

const promises = []

async function visit(url) {
    
    console.log("/////////// " + url + " ///////////")
    
    const res = await fetch(url);
    const body = await res.text();

    const checked_links = []

    const page = parse(body)

    const links = page.querySelectorAll('a')
 
    for(let i=0; i<links.length;  i++){
        let link_url = links[i].getAttribute('href')
        
        // If absolute path, add base url
        if(link_url[0]==='/') link_url = url + link_url
        
        // If link is from same page, save to enter later
        const regex = new RegExp(url)
        if(regex.test(link_url)){
            let valid = true
            // If something in the link is in the excluded list, don't save
            for(let excluded of config.exclude){
                if(new RegExp(excluded).test(link_url)){
                    //console.log(link_url + ' excluded bc has '+excluded)
                    valid = false
                }
            }
            if(valid) linksToVisit.set(link_url, false) // false for non visited, true for visited
        }
        
        // If link is not in checked_links, check
        let index = checked_links.findIndex(val => val === link_url)
        if(index < 0){
            checked_links.push(link_url)
            
            // If link in false negatives, skip
            if(config.falseNegatives.findIndex(val => val === link_url) >= 0) continue
            // If nothing in url 🤷 skip
            if(link_url === '') continue
            
            const prom = fetch(link_url)
                .then(link_response => {
                    if(link_response.status > 400) console.log(chalk.red(link_url +' - '+ link_response.status))
                })
                .catch(err => {
                    console.log(chalk.yellow(link_url +' - Fetch failed'))
                })

            promises.push(prom)
            
        }
    }
    linksToVisit.set(url, true)

    // Search for next non visited link in list
    let nextLink = null
    for(let link of linksToVisit){
        if(link[1] === false){
            nextLink = link[0]
            break
        }
    }

    // Check if ended
    /*let ended = false
    for(let link of linksToVisit){
        ended = link[1]
    }
    if(ended) end()
    */
    
    if(nextLink){
        visit(nextLink)
    }else{
        end()
    }
}

await visit(baseUrl)


function end(){
    console.log("End")
    //console.log(linksToVisit)
}
/*
Promise.all(promises).then( () => {
    //console.log(checked_links)
})*/
