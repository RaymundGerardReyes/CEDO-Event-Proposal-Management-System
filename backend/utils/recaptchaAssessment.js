// backend/utils/recaptchaAssessment.js
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

/**
 * Create an assessment to analyze the risk of a UI action.
 *
 * @param {string} projectID - Your Google Cloud Project ID.
 * @param {string} recaptchaKey - The reCAPTCHA key associated with the site/app.
 * @param {string} token - The generated token obtained from the client.
 * @param {string} recaptchaAction - Action name corresponding to the token.
 */
async function createAssessment({
    projectID = "modern-vortex-455007-r2",
    recaptchaKey = "6LcTTzUrAAAAAHd6nbv15aXhrdoZgkywzPwyrQch",
    token,
    recaptchaAction,
}) {
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    const request = {
        assessment: {
            event: {
                token: token,
                siteKey: recaptchaKey,
            },
        },
        parent: projectPath,
    };

    const [response] = await client.createAssessment(request);

    if (!response.tokenProperties.valid) {
        console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
        return null;
    }

    if (response.tokenProperties.action === recaptchaAction) {
        console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
        response.riskAnalysis.reasons.forEach((reason) => {
            console.log(reason);
        });
        return response.riskAnalysis.score;
    } else {
        console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
        return null;
    }
}

module.exports = { createAssessment };