import 'package:flutter/material.dart';
import 'package:shaxe/models/post.dart';
import 'package:shaxe/models/user.dart';
import 'package:shaxe/services/posts.dart';

class ItemPost extends StatefulWidget {
  final PostModel post;
  final AsyncSnapshot<UserModel> snapshotUser;
  final AsyncSnapshot<bool> snapshotLike;
  final AsyncSnapshot<bool> snapshotRetweet;
  final bool retweet;

  const ItemPost(this.post, this.snapshotUser, this.snapshotLike,
      this.snapshotRetweet, this.retweet,
      {Key? key})
      : super(key: key);

  @override
  _ItemPostState createState() => _ItemPostState();
}

class _ItemPostState extends State<ItemPost> {
  PostService _postService = PostService();
  @override
  Widget build(BuildContext context) {
    return ListTile(
      key: ValueKey(widget.post.id),
      title: Padding(
          padding: EdgeInsets.fromLTRB(0, 15, 0, 15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if ((widget.snapshotRetweet.data ?? false) || widget.retweet)
                Text("Share"),
              SizedBox(height: 20),
              Row(
                children: [
                  widget.snapshotUser.data?.profileImageUrl != null &&
                          widget.snapshotUser.data!.profileImageUrl != ''
                      ? CircleAvatar(
                          radius: 20,
                          backgroundImage: NetworkImage(
                              widget.snapshotUser.data!.profileImageUrl))
                      : Icon(Icons.person, size: 40),
                  SizedBox(width: 10),
                  Text(widget.snapshotUser.data?.userName ?? '')
                ],
              ),
            ],
          )),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(0, 15, 0, 15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.post.text),
                SizedBox(height: 20),
                Text(widget.post.timestamp.toDate().toString()),
                SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Row(
                      children: [
                        IconButton(
                            icon: new Icon(Icons.chat_bubble_outline,
                                color: Colors.deepPurple, size: 30.0),
                            onPressed: () => Navigator.pushNamed(
                                context, '/replies',
                                arguments: widget.post)),
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                            icon: new Icon(
                                (widget.snapshotRetweet.data ?? false)
                                    ? Icons.cancel
                                    : Icons.share,
                                color: Colors.deepPurple,
                                size: 30.0),
                            onPressed: () => _postService.retweet(
                                widget.post, widget.snapshotRetweet.data ?? false)),
                        Text(widget.post.share.toString())
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                            icon: new Icon(
                                (widget.snapshotLike.data ?? false)
                                    ? Icons.favorite
                                    : Icons.favorite_border,
                                color: Colors.blue,
                                size: 30.0),
                            onPressed: () {
                              _postService.likePost(
                                  widget.post, widget.snapshotLike.data ?? false);
                            }),
                        Text(widget.post.like.toString())
                      ],
                    )
                  ],
                )
              ],
            ),
          ),
          Divider(),
        ],
      ),
    );
  }
}