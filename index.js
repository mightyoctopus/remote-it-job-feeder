const express = require('express');
const path = require('path');

const bodyParser = require('body-parser');
const axios = require('axios');
const { calculateLimitAndOffset, paginate } = require('paginate-info');

const app = express();
const port = 3000;


app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 


const baseUrl = 'https://devitjobs.com/api/jobsLight';

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(baseUrl);
        const result = response.data;
        
        let remoteJobs = [];
        result.forEach(remote => {
            if (remote.isFullRemote === true) {
                remoteJobs.push(remote);
            }
        });
        console.log(remoteJobs);

        //Pagination with paginate-info middleware
        const page = req.query.page || 1;
        const limit = req.query.limit || 20;
        
        const { limit: calcLimit, offset } = calculateLimitAndOffset(page, limit);
        const paginatedData = remoteJobs.slice(offset, offset + calcLimit);
        const paginatedResult = paginate(page, remoteJobs.length, paginatedData, calcLimit);



        //Convert the ISO8610 date format into the standard US timestamp
        // The first attempt to change it from the client side failed due to a format conflict!
        remoteJobs.map(job => {
            const date = new Date(job.activeFrom);
            const options = {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            };
            job.formattedDate = date.toLocaleDateString('en-US', options);

            return job;
        });

        res.render('index', { content: paginatedData, paginatedResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error'});
    }
});



app.listen(port, () => {
    console.log("Server is running on port:", port);
});