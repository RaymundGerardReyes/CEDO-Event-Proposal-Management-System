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
    recaptchaKey = process.env.RECAPTCHA_SITE_KEY,
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

    try {
        const response = await client.createAssessment(request);

        // Handle different response formats
        let assessmentResponse;
        if (Array.isArray(response)) {
            assessmentResponse = response[0];
        } else {
            assessmentResponse = response;
        }

        // Check if response exists
        if (!assessmentResponse) {
            return undefined;
        }

        // Check if tokenProperties exists
        if (!assessmentResponse.tokenProperties) {
            return undefined;
        }

        if (!assessmentResponse.tokenProperties.valid) {
            console.log(`The CreateAssessment call failed because the token was: ${assessmentResponse.tokenProperties.invalidReason}`);
            return null;
        }

        if (assessmentResponse.tokenProperties.action === recaptchaAction) {
            // Check if riskAnalysis exists
            if (!assessmentResponse.riskAnalysis) {
                return undefined;
            }

            console.log(`The reCAPTCHA score is: ${assessmentResponse.riskAnalysis.score}`);

            // Check if reasons array exists before iterating
            if (assessmentResponse.riskAnalysis.reasons && Array.isArray(assessmentResponse.riskAnalysis.reasons)) {
                assessmentResponse.riskAnalysis.reasons.forEach((reason) => {
                    console.log(reason);
                });
            }

            return assessmentResponse.riskAnalysis.score;
        } else {
            console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
            return null;
        }
    } catch (error) {
        // Re-throw the error to maintain the original behavior
        throw error;
    }
}

module.exports = { createAssessment };