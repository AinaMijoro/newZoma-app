import {
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
    TextInput
  } from "react-native";
  import {RFPercentage} from "react-native-responsive-fontsize";
  import {SafeAreaView} from "react-native-safe-area-context";



  export default function HomeScreen({ navigation }) {
    const [email, setEmail] = useState("");

    function signup() {
      navigation.navigate("signup");
    }

    return (
      <SafeAreaView>
        <Image source={require("../assets/logo.jpg")} style={styles.logo}/>
        <Text style={styles.text1}>Bienvenue sur Zoma</Text>
        <Text style={styles.text2}>Mandrosoa tompoko ô !</Text>
        <TextInput
        placeholder="adresse email"
        textContentType="email"
        style={styles.inputBox}
        onChangeText={(value) => setEmail(value)}
        value={email}
      />

        <Button style={styles.button}
          title="Se connecter"
          onPress={() => navigation.navigate('SignIn')}
        />
        <Button style={styles.button}
          title="S'enregistrer'"
          onPress={() => navigation.navigate('signup')}
        />
         <TouchableOpacity>
        <Text style={styles.pressableText}>Mot de passe oublié</Text>
      </TouchableOpacity>
      
      </SafeAreaView>
    );
   }
   const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 20,
      backgroundColor: "#003300"
    },
    logo: {
      width: "100%",
      maxHeight: "40%",
      borderWidth: 3,
      borderRadius: 10,
      marginTop: 20
    },
    inputBox: {
      paddingHorizontal: 20,
      width: "100%",
      minHeight: "7%",
      backgroundColor: "#fff",
      borderColor: "#CDAB82",
      borderWidth: 3,
      borderRadius: 10,
      marginTop: "5%",
      fontSize: RFPercentage(2)
    },
    button: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      width: "100%",
      minHeight: "7%",
      backgroundColor: "#CDAB82",
      borderColor: "#CDAB82",
      borderWidth: 3,
      borderRadius: 10,
      marginTop: "5%"
    },
    pressableText: {
      textDecorationLine: "underline",
      color: "#CDAB82",
      marginTop: "5%",
      fontSize: RFPercentage(2)
    },
    text1: {
      fontSize: RFPercentage(2),
      color: "#66CC00",
      fontWeight: "500"
    },
    text2: {
        fontSize: RFPercentage(2),
        color: "#FFFFFF",
        fontWeight: "400"
      }
  });