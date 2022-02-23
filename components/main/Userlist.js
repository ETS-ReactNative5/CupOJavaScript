import React, {useState} from 'react'
import { StatusBar } from 'expo-status-bar'
import fire from '../fire'
import { Text, View, FlatList, Image, Modal, TouchableOpacity, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../assets/colors/colors';

export default function Userlist()
{    
    const [userList, setUserList] = useState(null);
    const [splitUserList, setSplitUserList] = useState(null);
    const usersDB = fire.firestore().collection('users');
    const friendsDB = fire.firestore().collection('friendships');
    const [userDataIsRetrieved, setUserDataIsRetrieved] = useState(false);
    
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupItem, setPopupItem] = useState(null);

    const [isFriend, setIsFriend] = useState(false);
    const currentUserID = fire.auth().currentUser.uid;

    const [startIndex, setStartIndex] = useState(5);
    const [endIndex, setEndIndex] = useState(10);


    //Get user information from firestore
    const getUsers = () =>
    {
        usersDB.get().then(function(querySnapshot) 
        {
            let userData = querySnapshot.docs.map(doc => doc.data())
            setUserList(userData)
            setSplitUserList(userData.slice(0, 5))
        }).catch(function(error) {console.log('Error getting documents: ', error)})

        setUserDataIsRetrieved(true);
    }

    const togglePopup = (item) =>
    {
        setPopupOpen(!popupOpen)

        if (item != null)
        {
            setPopupItem(item);

            checkFriends(item)
        }
    }

    const continueList = (start, end) =>
    {
        setSplitUserList(splitUserList.concat(userList.slice(start, end)));
        setStartIndex(startIndex + 5);
        setEndIndex(endIndex + 5);
    }

    if (userDataIsRetrieved == false)
    {
        getUsers();
    }

    function checkFriends(user2)
    {
        friendsDB.get().then(function(querySnapshot) 
        {
            let friendshipData = querySnapshot.docs.map(doc => doc.data());

            for (let i = 0; i < friendshipData.length; i++)
            {
                if ((friendshipData[i].user1 == currentUserID && friendshipData[i].user2 == user2.id) || 
                (friendshipData[i].user2 == currentUserID && friendshipData[i].user1 == user2.id))
                {
                    setIsFriend(true);
                }
            }
        }).catch(function(error) {console.log('Error getting documents: ', error)})
    }

    function sendFriendRequest(user2)
    {
        usersDB.doc(user2.id).collection("friendRequests").get().then(function(querySnapshot) 
        {
            let friendRequests = querySnapshot.docs.map(doc => doc.data());
            let hasPendingRequest = false;

            for (let i = 0; i < friendRequests.length; i++)
            {
                if (friendRequests[i].userID == currentUserID)
                {
                    hasPendingRequest = true;
                }
            }

            if (hasPendingRequest)
            {
                alert("Friend request already pending.");
            }
            else
            {
                usersDB.doc(user2.id).collection("friendRequests").add({userID: currentUserID});
                alert("Friend request sent!");
                checkForAcceptFriendRequest(user2.id);
            }

        }).catch(function(error) {console.log('Error getting documents: ', error)})
    }

    function checkForAcceptFriendRequest(user2ID)
    {
        usersDB.doc(currentUserID).collection("friendRequests").get().then(function(querySnapshot) 
        {
            let friendRequests = querySnapshot.docs.map(doc => doc.data());
            let hasPendingRequest = false;

            for (let i = 0; i < friendRequests.length; i++)
            {
                if (friendRequests[i].userID == user2ID)
                {
                    hasPendingRequest = true;
                }
            }

            if (hasPendingRequest)
            {
                acceptFriendRequest(user2ID);
            }

        }).catch(function(error) {console.log('Error getting documents: ', error)})
    }

    function acceptFriendRequest(user2ID)
    {
        friendsDB.get().then(function(querySnapshot) 
        {
            let friendshipData = querySnapshot.docs.map(doc => doc.data());
            let friendshipExists = false;

            for (let i = 0; i < friendshipData.length; i++)
            {
                if ((friendshipData[i].user1 == currentUserID && friendshipData[i].user2 == user2ID) || 
                (friendshipData[i].user2 == currentUserID && friendshipData[i].user1 == user2ID))
                {
                    friendshipExists = true;
                }
            }

            if (!friendshipExists)
            {
                friendsDB.add({user1: user2ID, user2: currentUserID})
            }
        }).catch(function(error) {console.log('Error getting documents: ', error)})
    }

    return (
        <LinearGradient colors={[colors.lightBlue, colors.darkBlue]} style={styles.outerScreen}>
        <SafeAreaView style = {styles.contentCenter}>
            <StatusBar barStyle='light-content' />
            <Text style = {styles.pageHeader}>List of Users</Text>
            <View style = {styles.innerScreen}>
                <View style={styles.topNav}>
                    <Pressable
                        style={styles.navLink}
                        title="Button 1"
                        onPress={() => {
                        console.log("Button 1 clicked")
                    }}>
                        <Text>Users</Text>
                    </Pressable>
                    <Pressable
                        style={styles.navLink}
                        title="Button 1"
                        onPress={() => {
                        console.log("Button 2 clicked")
                    }}>
                        <Text>Friend Request's</Text>
                    </Pressable>
                </View>
                {splitUserList != null &&
                    <FlatList
                    data={splitUserList}
                    renderItem={({item}) => 
                        <View style = {styles.profileData}>
                            <TouchableOpacity onPress = {() => togglePopup(item)}>
                                <Image source={{uri: item.profilePicId}} style={styles.profilePicture}/>
                                <View style={{ alignItems: 'center'}}>
                                    <Text style= {styles.name}>{item.first_name + " " + item.last_name}</Text>
                                    <Text style = {styles.purposeText}>I want to {item.purpose} weight!{'\n'}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>}
                    onEndReached = {() => continueList(startIndex, endIndex)}
                    onEndReachedThreshold = {1}
                    keyExtractor = {(item, index) => index.toString()}
                    />
                }

                {popupItem != null &&
                <Modal animationType = 'none' visible = {popupOpen} transparent = {true}>
                    <View style = {styles.center}>
                        <View style = {styles.modalBody}>
                            <TouchableOpacity onPress = {() => {togglePopup(null); setIsFriend(false);}}>
                                <Text style = {styles.xbutton}>X</Text>
                            </TouchableOpacity>
                            <Text>{popupItem.first_name}</Text>
                            <Text>{popupItem.sex}</Text>
                            <Text>{popupItem.feet}' {popupItem.inches}"</Text>
                            <Text>{popupItem.weight}lbs</Text>
                            <Text>{popupItem.bmi}</Text>


                            {isFriend == false && popupItem.id != currentUserID &&
                                <TouchableOpacity onPress = {() => sendFriendRequest(popupItem)}>
                                    <Text>Send Friend Request</Text>
                                </TouchableOpacity>
                            }
                            {isFriend == true &&
                                <Text>You are friends!</Text>
                            }
                        </View>
                    </View>
                </Modal>}
            </View>
        </SafeAreaView>
        </LinearGradient>
    );
}   

const styles =
{
    name:
    {
        fontSize: 23,
        fontFamily: 'NunitoSans-Bold',
        marginLeft: 10
    },
    purposeText:
    {
        fontFamily: 'NunitoSans-Regular',
        fontSize: 18,
        marginLeft: 10
    },
    profilePicture:
    {
        marginLeft: 10,
        marginTop: 10,
        width: 180,
        height: 180,
        borderRadius: 100,
    },
    outerScreen: 
    {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '100%'
    },
    pageHeader:
    {
        fontSize: 30,
        fontFamily: 'NunitoSans-Bold',
        color: '#000000'
    },
    contentCenter:
    {
        height: '100%',
        alignItems: 'center'
    },
    innerScreen:
    {
        height: '95%',
        width: '100%',
        backgroundColor: "#FFFFFF",
        borderRadius: 0
    },
    profileData:
    {
        borderWidth: 0.25,
        borderColor: "#D3D3D3",
        alignItems: 'center'
    },
    center: 
    {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20
    },
    modalBody: 
    {
        backgroundColor: '#F8F8FF',
        borderRadius: 10,
        width: '100%',
        height: '40%',
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: 
        {
          width: 20,
          height: 3
        },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 40
    },
    xbutton:
    {
        marginTop: 10,
        marginLeft: 290,
        fontSize: 30,
        opacity: 0.3
    },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        padding: '5px'
    },
    navLink: {
        backgroundColor: '#ccc',
        borderRadius: '5px',
        paddingTop: '10px',
        paddingBottom: '10px',
        width: '49.5%',
        textAlign: 'center'
    }
}