const express = require("express");
const router  = express.Router({mergeParams: true});
const campaign = require("../models/campaign");
const Comment = require("../models/comment");
const middleware = require("../middleware");
const { isLoggedIn, checkUserComment, isAdmin } = middleware;

//Comments New
router.get("/new", isLoggedIn, function(req, res){
    // find campaign by id
    //console.log(req.params.id);
    campaign.findById(req.params.id, function(err, campaign){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {campaign: campaign});
        }
    })
});

//Comments Create
router.post("/", isLoggedIn, function(req, res){
   //lookup campaign using ID
   campaign.findById(req.params.id, function(err, campaign){
       if(err){
           console.log(err);
           res.redirect("/campaigns");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //console.log(campaign.name)
               comment.campaignID=campaign._id;

               //save comment
               comment.save();
               campaign.comments.push(comment);
               campaign.save();
               console.log(comment);
               req.flash('success', 'Created a comment!');
               res.redirect('/campaigns/' + campaign._id);

           }
        });
       }
   });
});

router.get("/:commentId/edit", isLoggedIn, checkUserComment, function(req, res){
  res.render("comments/edit", {campaign_id: req.params.id, comment: req.comment});
});

router.put("/:commentId", isAdmin, function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
          console.log(err);
           res.render("edit");
       } else {
           res.redirect("/campaigns/" + req.params.id);
       }
   });
});

router.delete("/:commentId", isLoggedIn, checkUserComment, function(req, res){
  // find campaign, remove comment from comments array, delete comment in db
  campaign.findByIdAndUpdate(req.params.id, {
    $pull: {
      comments: req.comment.id
    }
  }, function(err) {
    if(err){
        console.log(err)
        req.flash('error', err.message);
        res.redirect('/');
    } else {
        req.comment.remove(function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('error', 'Comment deleted!');
          res.redirect("/campaigns/" + req.params.id);
        });
    }
  });
});

module.exports = router;
