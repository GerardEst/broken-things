//import got from 'got';
import { parse } from 'node-html-parser';
import { config } from './config.js'

const baseUrl = 'https://'+config.baseUrl

const tree = new Map()

function visit(url) {

}

const res = await fetch(baseUrl);
const body = await res.text();


//const checked_images = []
const checked_links = []

const page = parse(body)

const links = page.querySelectorAll('a')
//const images = page.querySelectorAll('img')

/*for(let img of images){
    const img_src = img.getAttribute('src')
    checked_images.push(img_src)
}*/


console.log("Finding links on neurorecursos.com home")
const promises = []
for(let i=0; i<links.length;  i++){
    let link_url = links[i].getAttribute('href')
    
    // If absolute path, add base url
    if(link_url[0]==='/') link_url = baseUrl + link_url
    
    // If link is from same page, save to enter later
    // If it's already there, don't add again
    const regex = new RegExp(baseUrl)
    if(regex.test(link_url)){
        tree.set(link_url, 0) // 0 for non visited, 1 for visited
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
                if(link_response.status > 400) console.log(link_url +' - '+ link_response.status)
            })
            .catch(err => {
                console.log(link_url +' - Fetch failed')
            })

        promises.push(prom)
        
    }
}




Promise.all(promises).then( () => {
    //console.log(checked_links)
    console.log(tree)
})
