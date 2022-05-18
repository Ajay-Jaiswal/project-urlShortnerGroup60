const urlModel = require("../model/urlModel")
const shortid = require("shortid")
const validUrl = require("valid-url")
const baseUrl ="http://localhost:3000"


const createShortUrl = async function(req, res){
    try{

        const { longUrl } = req.body // destructure the longUrl from req.body.longUrl
        if (!Object.keys(req.body).length) {
            return res.status(400).send({ status: false, message: "please provide url details" }) 
        }
        if (!validUrl.isUri(baseUrl)) { return res.status(400).send('Invalid base URL')} 
        // check base url if valid using the validUrl.isUri method
    
        const urlCode = shortid.generate()    // if valid, we create the url code
    
        // check long url if valid using the validUrl.isUri method
        if (validUrl.isUri(longUrl)) {
                /* The findOne() provides a match to only the  of thesubset documents 
                in the collection that match the query. In this case, before creating the short URL,
                we check if the long URL was in the DB ,else we create it.*/
                
                let url = await urlModel.findOne({ longUrl }) 
    
                if (url) { res.send(url) }  // url exist and return the respose
                 else {
                    const shortUrl = baseUrl + '/' + urlCode   // join the generated short code the the base url

                    url = new urlModel({ longUrl, shortUrl, urlCode, date: new Date() }) // invoking the Url model and saving to the DB
                    
                    await url.save()
                    res.send(url)
                }
        } else { res.status(400).send('Invalid longUrl') } 

    }
    catch(error){
        res.status(500).send({ status: false, message:error.message})
    }
}

const getUrl=async function(req,res){
    try{
    let urlCode=req.params.urlCode
    let url=await urlModel.findOne({urlCode:urlCode})
    console.log(url)
    if(url){
        return res.status(302).redirect(url.longUrl)
    }
    return res.status(404).send({status:false,message:"url not found"})
    }
    catch(error){
        res.status(500).send({ status: false, message:error.message})
    }
}


module.exports.createShortUrl = createShortUrl
module.exports.getUrl = getUrl