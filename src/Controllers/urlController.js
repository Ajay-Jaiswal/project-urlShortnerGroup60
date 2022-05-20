const urlModel = require("../model/urlModel")
const shortid = require("shortid")
const validUrl = require("valid-url")
const baseUrl ="http://localhost:3000"
const redis = require("redis")
const{promisify} = require("util")


//Connect to redis
const redisClient = redis.createClient(
    12381,
    "redis-12381.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("TJvkt2L7N6K6bHx4TyCKK8tT0QT1Rtut", function (err) {
    if (err) throw err;
  });
      
redisClient.on("connect", async function () {
        console.log("Connected to Redis..");
    });
      

//Connection setup for redis     
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


/****************************** Validation function*********************************/
let isValid = function (value) {
    if (typeof (value) === "undefined" || typeof (value) == null) { return false }
    if (typeof (value) === "string" && value.trim().length == 0) { return false }
    return true
}

const isValidURL = function (value) {
    if (!(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)/.test(value)))
        return false

    return true
}
/***********************************************************************************/


const createShortUrl = async function(req, res){
    try{
        let data = req.body
        const { longUrl } = data


        if (!Object.keys(data).length || !isValid(data)) 
            return res.status(400).send({ status: false, message: "Please enter your URL." }) 

        if (!validUrl.isUri(longUrl)) 
            return res.status(400).send({status: false, message:'Enter a valid URL'})

        if(!isValidURL(longUrl)){
            return res.status(400).send({status: false, message:'Enter a valid URL'})
        }

        if (!validUrl.isUri(baseUrl)) 
            return res.status(400).send({status: false, message:'Enter a valid base URL'}) 

        let findUrl = await urlModel.findOne({ longUrl: longUrl }).select({__v: 0, _id: 0})
        if(findUrl)
            return res.status(200).send({status: true, message: "Already created short url for this long url", data: findUrl})
    
        const urlCode = shortid.generate()    
        const shortUrl = baseUrl + '/' + urlCode

        data.urlCode = urlCode
        data.shortUrl = shortUrl

        await urlModel.create({urlCode: urlCode, longUrl: longUrl, shortUrl: shortUrl})

        // setting in cache
        //await SET_ASYNC(`${shortUrl}`, JSON.stringify(createUrl))
        //await SET_ASYNC(`${longUrl}`, JSON.stringify(createUrl))
        await SET_ASYNC(`${urlCode}`, JSON.stringify(createUrl))

        return res.status(201).send({status: true, message: "Successfully Shorten the URL.", data: {urlCode: urlCode, longUrl: longUrl, shortUrl: shortUrl}})

    }
    catch(error){
        res.status(500).send({ status: false, message:error.message})
    }
}


const getUrl=async function(req,res){
    try{
        let urlCode= await GET_ASYNC(`${req.params.urlCode}`)
        if(urlCode){
            let url = JSON.parse(urlCode)
            res.status(302).redirect(url.longUrl)
        }
        else{
            let findUrl = await urlModel.findOne({urlCode: req.params.urlCode})
            if(!findUrl)
            return res.status(404).send({status:false,message:"url not found"})
            await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(findUrl))
            res.status(302).redirect(findUrl.longUrl)
        }

    } catch(error) {
            res.status(500).send({ status: false, message:error.message})
    }
}


module.exports = { createShortUrl, getUrl }