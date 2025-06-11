const { auth } = require('../config/firebase');

exports.registerUser = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password || password.length < 6){
        return res.status(400).json({error: 'Invalid email or password entered'});
    }

    try{
        const userRecord = await auth.createUser({
        email: email,
        password: password
    });

    const customToken = await auth.createCustomToken(userRecord.uid);

    res.status(201).json({
    message: 'User successfully created and logged in!',
    uid: userRecord.uid,
    email: userRecord.email,
    customToken: customToken});

    } catch(err) {
        console.error('User could not be created! Error: ', err);
        return res.status(400).json({error: 'User could not be created. Invalid email or passowrd'});
    }


}
    


