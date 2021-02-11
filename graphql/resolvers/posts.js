const Post = require('../../models/Post');
const checkAuth = require('../../util/check-auth');
const {AuthenticationError} = require('apollo-server');
const {UserInputError}=require('apollo-server');

module.exports= {
    Query: {
        async getPosts() {
            try{
                const posts = await Post.find().sort({createdAt: -1});
                return posts;
            }catch(err){
                throw new Error(err);
            }
        },
        async getPost(_,{postId}){
            try{
                const post= await Post.findById(postId);
                if(post){
                    return post;
                }
                else 
                {
                    throw new Error('Post not found');
                }
            }catch(err){
                throw new Error(err);
            }
        }, 
    },
    Mutation:{
        async createPost(_,{body},context){

            if(body.trim()==='')
            {
                throw new UserInputError('Empty post cannot be created',{
                    errors:{
                        body: 'Empty post cannot be created'
                    }
                })
            }

            const user = checkAuth(context);

            const newPost = new Post({
                body:body,
                user:user.id,
                username:user.username,
                createdAt: new Date().toISOString()
            });

            const post = await newPost.save();

            return post;
        },
        async deletePost(_,{postId},context){
            try{
                const post = await Post.findById(postId);
                if(!post)
                {
                    throw new UserInputError('Post not found');
                }
                const user = checkAuth(context);
                if(user.username===post.username){
                    await post.delete();
                    return 'Post deleted successfully';
                }else {
                    throw new AuthenticationError('Action not allowed');
                }                   
            }catch(err){
                throw new Error(err);
            }

        },
        async likePost(_,{postId},context){
            const {username} = checkAuth(context);

            const post = await Post.findById(postId);
            if(post)
            {
                if(post.likes.find(like=> like.username===username)){
                    post.likes= post.likes.filter(like=>like.username!== username);
                }
                else 
                {
                    post.likes.push({
                        username,
                        createdAt: new Date().toISOString()
                    })
                }
                await post.save();
                return post;
            }
            throw UserInputError('Post not found');

        }
    }
}