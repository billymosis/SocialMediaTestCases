import { check } from 'k6';
import { generateTestObjects, generateUniqueName, generateRandomPassword, generateUniqueUsername, isEqual, isExists, testPostJson, generateRandomPhoneNumber, generateRandomEmail } from "../helper.js";

const registerPhoneTestObjects = generateTestObjects({
    credentialType: { type: "string", enum: ["phone"], notNull: true },
    credentialValue: { type: "string", minLength: 7, maxLength: 13, notNull: true, isPhoneNumber: true, addPlusPrefixPhoneNumber: true },
    name: { type: "string", minLength: 5, maxLength: 50, notNull: true },
    password: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    credentialType: "phone",
    credentialValue: generateRandomPhoneNumber(true),
    name: generateUniqueName(),
    password: generateRandomPassword()
})

const registerEmailTestObjects = generateTestObjects({
    credentialType: { type: "string", enum: ["email"], notNull: true },
    credentialValue: { type: "string", notNull: true, isEmail: true },
    name: { type: "string", minLength: 5, maxLength: 50, notNull: true },
    password: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    credentialType: "email",
    credentialValue: generateRandomEmail(),
    name: generateUniqueName(),
    password: generateRandomPassword()
})


const TEST_NAME = "(register test)"

export function RegistrationTest(doNegativeCase) {
    let res;
    let route = __ENV.BASE_URL + "/v1/user/register"
    if (doNegativeCase) {
        res = testPostJson(route, {}, {}, ["noContentType"])
        check(res, {
            [TEST_NAME + "post register no body should return 400"]: (r) => r.status === 400
        })
    }

    const usrByPhone = PhoneRegistrationTest(route, doNegativeCase)
    const usrByEmail = EmailRegistrationTests(route, doNegativeCase)

    return [usrByPhone, usrByEmail]
}


function PhoneRegistrationTest(route, doNegativeCase) {
    let res
    const currentFeature = TEST_NAME + "post register phone"
    const usr = {
        credentialType: "phone",
        credentialValue: generateRandomPhoneNumber(true),
        name: generateUniqueName(),
        password: generateRandomPassword()
    }

    if (doNegativeCase) {
        registerPhoneTestObjects.forEach(payload => {
            res = testPostJson(route, payload)
            check(res, {
                [currentFeature + ' wrong value should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
    }

    res = testPostJson(route, usr)
    let isSuccess = check(res, {
        [currentFeature + " correct value should return 200 | " + JSON.stringify(usr)]: (r) => r.status === 200,
        [currentFeature + " correct value should have phone property"]: (r) => isEqual(r, "data.phone", usr.credentialValue),
        [currentFeature + " correct value should have name property"]: (r) => isEqual(r, "data.name", usr.name),
        [currentFeature + " correct value should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })

    if (doNegativeCase && isSuccess) {
        res = testPostJson(route, body)
        isSuccess = check(res, {
            [currentFeature + " duplicate user should return 409"]: (r) => r.status === 409
        })
    }

    return isSuccess ? {
        accesstoken: res.json().data.accesstoken,
        phone: usr.credentialvalue,
        name: usr.name,
        password: usr.password
    } : null
}
function EmailRegistrationTests(route, doNegativeCase) {
    let res
    const currentFeature = TEST_NAME + "post register email"
    const usr = {
        credentialType: "email",
        credentialValue: generateRandomEmail(),
        name: generateUniqueName(),
        password: generateRandomPassword()
    }

    if (doNegativeCase) {
        registerEmailTestObjects.forEach(payload => {
            res = testPostJson(route, payload)
            check(res, {
                [currentFeature + ' wrong value should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
    }

    let isSuccess = check(res, {
        [currentFeature + " correct value should return 200 | " + JSON.stringify(usr)]: (r) => r.status === 200,
        [currentFeature + " correct value should have email property"]: (r) => isEqual(r, "data.email", usr.credentialValue),
        [currentFeature + " correct value should have name property"]: (r) => isEqual(r, "data.name", usr.name),
        [currentFeature + " correct value should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })

    if (doNegativeCase && isSuccess) {
        res = testPostJson(route, body)
        isSuccess = check(res, {
            [currentFeature + " duplicate user should return 409"]: (r) => r.status === 409
        })
    }

    return isSuccess ? {
        accesstoken: res.json().data.accesstoken,
        email: usr.credentialvalue,
        name: usr.name,
        password: usr.password
    } : null
}