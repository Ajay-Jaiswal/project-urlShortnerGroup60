const urlModel = require("../model/urlModel")
const shortUrl = require("node-url-shortener")
const shortid = require("shortid")
const validUrl = require("valid-url")
const baseUrl ="http://localhost:3000"

const createShortUrl = async function(req, res){
    try{
        const { longUrl} = req.body // destructure the longUrl from req.body.longUrl
    
        // check base url if valid using the validUrl.isUri method
        if (!validUrl.isUri(baseUrl)) {
            return res.status(401).json('Invalid base URL')
        }
    
        // if valid, we create the url code
        const urlCode = shortid.generate()
    
        // check long url if valid using the validUrl.isUri method
        if (validUrl.isUri(longUrl)) {
            try {
                /* The findOne() provides a match to only the subset of the documents 
                in the collection that match the query. In this case, before creating the short URL,
                we check if the long URL was in the DB ,else we create it.
                */
                let url = await urlModel.findOne({ longUrl })
    
                // url exist and return the respose
                if (url) {
                    res.json(url)
                } else {
                    // join the generated short code the the base url
                    const shortUrl = baseUrl + '/' + urlCode
    
                    // invoking the Url model and saving to the DB
                    url = new urlModel({
                        longUrl,
                        shortUrl,
                        urlCode,
                        date: new Date()
                    })
                    await url.save()
                    res.json(url)
                }
            }
            // exception handler
            catch (err) {
                console.log(err)
                res.status(500).json('Server Error')
            }
        } else {
            res.status(401).json('Invalid longUrl')
        }
    
    }
    catch(error){
        res.status(500).send({ status: false, message:error.message})
    }
}

module.exports.createShortUrl = createShortUrl