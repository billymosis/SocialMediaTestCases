import { check } from "k6";
import { generateRandomEmail, isEqual, generateRandomPhoneNumber, testPostJson, generateTestObjects, isExists } from "../helper.js";

const TEST_NAME = "(link phone / email test)"

const linkPhoneTestObjects = generateTestObjects({
    credentialValue: { type: "string", minLength: 7, maxLength: 13, notNull: true, isPhoneNumber: true, addPlusPrefixPhoneNumber: true },
}, {
    phone: generateRandomPhoneNumber(true),
})

const linkEmailTestObjects = generateTestObjects({
    credentialValue: { type: "string", notNull: true, isEmail: true },
}, {
    email: generateRandomEmail(),
})


export function LinkCredential(userByPhone, userByEmail, doNegativeCase) {
    // eslint-disable-next-line no-undef
    let route = __ENV.BASE_URL + "/v1/user/link"

    const usrByPhone = LinkPhoneTest(route, userByEmail, userByPhone, doNegativeCase)
    const usrByEmail = LinkEmailTest(route, userByEmail, userByPhone, doNegativeCase)

    return [usrByPhone, usrByEmail]
}

function LinkPhoneTest(baseRoute, userByEmail, userByPhone, doNegativeCase) {
    let res
    const currentFeature = TEST_NAME + "post link phone"
    const route = baseRoute + "/phone"
    // eslint-disable-next-line no-undef
    let loginRoute = __ENV.BASE_URL + "/v1/user/login"
    const positivePayload = {
        phone: generateRandomPhoneNumber(true)
    }

    const userByEmailHeaders = { "Authorization": "Bearer " + userByEmail.accessToken }
    const userByPhoneHeaders = { "Authorization": "Bearer " + userByPhone.accessToken }

    if (doNegativeCase) {
        // Negative case, no auth
        res = testPostJson(route, {}, {})
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, no body
        res = testPostJson(route, {}, userByPhoneHeaders, ["noContentType"])
        check(res, {
            [currentFeature + " no body should return 400"]: (r) => r.status === 400
        })

        // Negative case, invalid body
        linkPhoneTestObjects.forEach(payload => {
            res = testPostJson(route, payload, userByPhoneHeaders)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })

        // Negative case, updating existing phone from user that registered using phone       
        res = testPostJson(route, {
            phone: userByPhone.phone,
        }, userByPhoneHeaders)
        check(res, {
            [currentFeature + " same phone from user that registered using phone number should return 400"]: (r) => r.status === 400
        })

        // Negative case, updating existing Phone from user that registered using email 
        res = testPostJson(route, {
            Phone: userByPhone.phone,
        }, userByEmailHeaders)
        check(res, {
            [currentFeature + " same phone from user that registered using email should return 409"]: (r) => r.status === 409,
        })
    }

    // Postiive case, updating phone
    res = testPostJson(route, positivePayload, userByEmailHeaders)
    let isSuccess = check(res, {
        [currentFeature + " correct body should return 200"]: (r) => r.status === 200,
    })

    // Positive case, login should give newly updated phone
    res = testPostJson(loginRoute, {
        credentialType: "phone",
        credentialValue: positivePayload.phone,
        password: userByEmail.password
    })
    isSuccess = check(res, {
        [currentFeature + " login with correct body should return 200"]: (r) => r.status === 200,
        [currentFeature + " login with correct body should have phone property"]: (r) => isEqual(r, "data.phone", positivePayload.phone),
        [currentFeature + " login with correct body should have email property"]: (r) => isEqual(r, "data.email", userByEmail.email),
        [currentFeature + " login with correct body should have name property"]: (r) => isEqual(r, "data.name", userByEmail.name),
        [currentFeature + " login with correct body should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })

    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        phone: positivePayload.phone,
        email: userByEmail.email,
        name: userByEmail.name,
        password: userByEmail.password
    } : null
}

function LinkEmailTest(baseRoute, userByEmail, userByPhone, doNegativeCase) {
    let res
    const currentFeature = TEST_NAME + "post link email"
    const route = baseRoute
    // eslint-disable-next-line no-undef
    let loginRoute = __ENV.BASE_URL + "/v1/user/login"
    const positivePayload = {
        email: generateRandomEmail()
    }

    const userByEmailHeaders = { "Authorization": "Bearer " + userByEmail.accessToken }
    const userByPhoneHeaders = { "Authorization": "Bearer " + userByPhone.accessToken }

    if (doNegativeCase) {
        // Negative case, no auth
        res = testPostJson(route, {}, {})
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, no body
        res = testPostJson(route, {}, userByEmailHeaders, ["noContentType"])
        check(res, {
            [currentFeature + " no body should return 400"]: (r) => r.status === 400
        })

        // Negative case, invalid body 
        linkEmailTestObjects.forEach(payload => {
            res = testPostJson(route, payload, userByEmailHeaders)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })

        // Negative case, updating existing email from user that registered using email       
        res = testPostJson(route, {
            email: userByEmail.email,
        }, userByEmailHeaders)
        check(res, {
            [currentFeature + " same email from user that registered using email should return 400"]: (r) => r.status === 400
        })

        // Negative case, updating existing email from user that registered using phone 
        res = testPostJson(route, {
            email: userByEmail.email,
        }, userByPhoneHeaders)
        check(res, {
            [currentFeature + " same email from user that registered using phone should return 409"]: (r) => r.status === 409,
        })
    }

    // Postiive case, updating email 
    res = testPostJson(route, positivePayload, userByPhoneHeaders)
    let isSuccess = check(res, {
        [currentFeature + " correct body should return 200"]: (r) => r.status === 200,
    })


    // Positive case, login should give newly updated email 
    res = testPostJson(loginRoute, {
        credentialType: "email",
        credentialValue: positivePayload.email,
        password: userByPhone.password
    })
    isSuccess = check(res, {
        [currentFeature + " login with correct body should return 200"]: (r) => r.status === 200,
        [currentFeature + " login with correct body should have phone property"]: (r) => isEqual(r, "data.phone", userByPhone.phone),
        [currentFeature + " login with correct body should have email property"]: (r) => isEqual(r, "data.email", positivePayload.email),
        [currentFeature + " login with correct body should have name property"]: (r) => isEqual(r, "data.name", userByPhone.name),
        [currentFeature + " login with correct body should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })

    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        phone: userByPhone.phone,
        email: positivePayload.email,
        name: userByPhone.name,
        password: userByPhone.password
    } : null
}