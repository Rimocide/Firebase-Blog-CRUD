const { firestore } = require('firebase-admin');
const { db, admin } = require('../config/firebase');

module.exports = (io) => {

    return {
        createPost: async (req, res) => {
            const {title, content} = req.body;
            const authorID = req.user.uid;
            const authorEmail = req.user.email;

            if(!title || !content) {
                return res.status(400).json({error: 'Title and body of the blog post is required'});
            }

            try {
                const newPostRef = db.collection('posts').add({
                    title,
                    content,
                    authorID,
                    authorEmail,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                const newPostSnapshot = await newPostRef.get();
                const newPost = {id: newPostSnapshot.id, ...newPostSnapshot.data()};

                io.emit(newPost)
                console.log('Post created and emitted:', newPost.id);
                res.status(201).json({message: 'New post created and emitted! ', post: newPost})
            } catch(err) {
                console.error('Error creating post:', err.message);
                res.status(500).json({ error: 'Failed to create post.' });   
            }
        },

        getPosts: async (req, res) => {
            try{
            const postRef = db.collection('posts');

            const snapshot = postRef.orderBy('createdAt', 'desc').get();

            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            res.status(200).json({posts}); }
            catch(err) {
                console.error('Posts could not be fetched due to a server error! Error: ', err);
                res.status(500).json({error: 'Error fetching posts'});
            }
        

        },

        getPostsById: async (req, res) => {
            try{
                postID = req.params.id;
                const postRef = db.collection('posts').doc(postID);
                const post = await postRef.get();

                if(!doc.exists) {
                    return res.status(404).json({error: 'Post with that ID does not exist'});
                }

                res.status(200).json({post: {id: post.id, ...post.data()}});
            } catch(err) {
                console.error('Error fetching post with that ID! Error: ', err);
                res.status(500).json({error: 'Error fetching post by ID'});  
            }
        },

        updatePost: async (req, res) => {
                const postID = req.params.id;
                const { title, content } = req.body;
                const userID = req.user.uid;

                if(!title && !content) {
                    return res.status(400).json({error: 'No update fields provided by the user!'});
                }
                try {
                    postRef = db.collection('posts').doc(postID);
                    doc = await postRef.get();
                    if(!doc.exists) {
                        return res.status(404).json({error: 'Post with that ID does not exist'});
                    }
                    if(doc.data().authorID!==userID){
                        return res.status(403).json({ error: 'Unauthorized: You can only update your own posts.' });
                    }
                    const updatedData = {updatedAt: admin.firestore.FieldValue.serverTimestamp()};
                    if (content) updatedData.title = title;
                    if (content) updatedData.content = content;
                    await postRef.update(updatedData);

                    updatedPostSnapshot = postRef.get();
                    updatedPost = {id: updatedPostSnapshot.id, ...updatedPostSnapshot.data()};

                    io.emit('post:updated', updatedPost);
                    res.status(200).json({message: 'Post updated successfully!', post: updatedPost});
                } catch(err) {
                    console.error('Error updating post with that ID! Error: ', err);
                    res.status(500).json({error: 'Error updating post with that ID'});  
                }
        },
    }
}