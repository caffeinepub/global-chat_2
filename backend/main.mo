import Time "mo:core/Time";
import Array "mo:core/Array";
import Text "mo:core/Text";

actor {
  type ChatMessage = {
    id : Text;
    username : Text;
    text : Text;
    timestamp : Time.Time;
    isBigMessage : Bool;
    isForced : Bool;
    isBot : Bool;
    isSystem : Bool;
    isBroadcast : Bool;
  };

  var messages : [ChatMessage] = [];
  var nextId = 0;

  public query ({ caller }) func getMessages(since : Time.Time) : async [ChatMessage] {
    messages.filter(func(msg) { msg.timestamp > since });
  };

  public shared ({ caller }) func postMessage(msg : ChatMessage) : async () {
    let newMsg = {
      id = nextId.toText();
      username = msg.username;
      text = msg.text;
      timestamp = msg.timestamp;
      isBigMessage = msg.isBigMessage;
      isForced = msg.isForced;
      isBot = msg.isBot;
      isSystem = msg.isSystem;
      isBroadcast = msg.isBroadcast;
    };

    var updatedMessages = [newMsg].concat(messages);

    if (updatedMessages.size() > 500) {
      updatedMessages := updatedMessages.sliceToArray(0, 500);
    };

    messages := updatedMessages;
    nextId += 1;
  };
};
