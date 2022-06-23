// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Student, sequelize } = require('../db/models');
const { Op } = require("sequelize");

// List
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    let pagination = {}
    // Phase 2A: Use query params for page & size
    // Your code here
    // Phase 2B (optional): Special case to return all students (page=0, size=0)
    // Phase 2B: Add an error message to errorResult.errors of
    // 'Requires valid page and size params' when page or size is invalid
    // Phase 2C: Handle invalid params with "Bad Request" response
    // Your code here

    let pageIsZero = false;
    let sizeIsZero = false;
    if (req.query.page == 0) pageIsZero = true
    if (req.query.size == 0) sizeIsZero = true

    let page = req.query.page === undefined ? 1 : parseInt(req.query.page);
    let size = req.query.size === undefined ? 10 : parseInt(req.query.size);

    if (page >= 1 && size >= 1) {
        pagination.size = Number(size);
        // Phase 2B: Calculate limit and offset
        pagination.page = Number(size) * (Number(page) - 1);
    } else if (sizeIsZero) {
        pagination.size = null;
    } else if (pageIsZero) {
        pagination.page = null;
        pagination.size = Number(size);
    } else {
        const totalRes = await Student.count();
        errorResult.errors.push({ message: 'Requires valid page and size params' })
        errorResult.pageCount = totalRes;
        next(errorResult)
    }

    // Phase 4: Student Search Filters
    /*
        firstName filter:
            If the firstName query parameter exists, set the firstName query
                filter to find a similar match to the firstName query parameter.
            For example, if firstName query parameter is 'C', then the
                query should match with students whose firstName is 'Cam' or
                'Royce'.

        lastName filter: (similar to firstName)
            If the lastName query parameter exists, set the lastName query
                filter to find a similar match to the lastName query parameter.
            For example, if lastName query parameter is 'Al', then the
                query should match with students whose lastName has 'Alfonsi' or
                'Palazzo'.

        lefty filter:
            If the lefty query parameter is a string of 'true' or 'false', set
                the leftHanded query filter to a boolean of true or false
            If the lefty query parameter is neither of those, add an error
                message of 'Lefty should be either true or false' to
                errorResult.errors
    */
    const where = {};
    if (req.query.firstName) {
        where.firstName = {
            [Op.like]: `%${req.query.firstName}%`
        }
    }

    if (req.query.lastName) {
        where.lastName = {
            [Op.like]: `%${req.query.lastName}%`
        }
    }
    if (req.query.lefty) {
        if (req.query.lefty === 'true') {
            where.leftHanded = {
                leftHanded: true
            }
        } else {
            where.leftHanded = {
                leftHanded: false
            }
        }
    }
    // Your code here


    // Phase 3C: Include total student count in the response even if params were
    // invalid
    /*
        If there are elements in the errorResult.errors array, then
        return a "Bad Request" response with the errorResult as the body
        of the response.

        Ex:
            errorResult = {
                errors: [{ message: 'Grade should be a number' }],
                count: 267,
                pageCount: 0
            }
    */
    // Your code here

    let result = {};

    // Phase 3A: Include total number of results returned from the query without
    // limits and offsets as a property of count on the result
    // Note: This should be a new query

    result.totalStudents = await Student.count();

    const leftHandedCount =  await Student.findOne({
        attributes: [[sequelize.fn('COUNT', sequelize.col('leftHanded')), 'total']],
        where: {
            leftHanded: true
        }
      });

    result.totalLeftHandedStudents = leftHandedCount;

    const rightHandedCount = await Student.findOne({
        attributes: [[sequelize.fn('COUNT', sequelize.col('leftHanded')), 'total']],
        where: {
            leftHanded: false
        }
      });
    result.totalRightHandedStudents = rightHandedCount;

    const alfonsiTotal = await Student.findOne({
        attributes: [[sequelize.fn('COUNT', sequelize.col('lastName')), 'total']],
        where: {
            lastName: 'Alfonsi'
        }
      });

    result.alfonsiTotalCount = alfonsiTotal;

    result.rows = await Student.findAll({
        attributes: ['id', 'firstName', 'lastName', 'leftHanded'],
        where,
        // Phase 1A: Order the Students search results
        order: [['lastName', 'ASC']],
        limit: pagination.size,
        offset: pagination.page
    });

    // Phase 2E: Include the page number as a key of page in the response data
    // In the special case (page=0, size=0) that returns all students, set
    // page to 1
    /*
        Response should be formatted to look like this:
        {
            rows: [{ id... }] // query results,
            page: 1
        }
    */
   if (!pagination.page) page = 1;

   result.page = page;

    // Phase 3B:
    // Include the total number of available pages for this query as a key
    // of pageCount in the response data
    // In the special case (page=0, size=0) that returns all students, set
    // pageCount to 1
    /*
        Response should be formatted to look like this:
        {
            count: 17 // total number of query results without pagination
            rows: [{ id... }] // query results,
            page: 2, // current page of this query
            pageCount: 10 // total number of available pages for this query
        }
    */
    const totalRes = await Student.count();
    let pageCount = Math.ceil(totalRes / size);
    result.pageCount = pageCount;
    res.json(result);
});

// Export class - DO NOT MODIFY
module.exports = router;
