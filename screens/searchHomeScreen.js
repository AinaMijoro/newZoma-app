
import React from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const categories = [
  {
    title: "TRAITEURS",
    description: "Apéros, plats, festins... spécialités malgaches à profusion",
  },
  {
    title: "ENVOI COLIS",
    description: "Monde vers Madagascar, Madagascar vers le Monde",
  },
  {
    title: "SERASERA",
    description: "Les bonnes affaires à saisir",
  },
  {
    title: "MAINS D’ŒUVRE",
    description: "Mécanicien, plombier, peintre, menuisier, déménageurs...",
  },
  {
    title: "PRODUITS MALGACHES",
    description: "THB, bonbons, lamba, épices, vanille, etc.",
  },
  {
    title: "AMBIANCE",
    description: "Soirées dansantes, DJ, animation...",
  },
];

export default function SearchHomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        Z<Text style={styles.logoRed}>O</Text>MA
      </Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Que recherchez-vous ?"
          placeholderTextColor="#999"
        />
        <Ionicons name="search-outline" size={22} color="#888" />
      </View>

      <Text style={styles.sectionTitle}>Les plus recherchés</Text>

      <ScrollView
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category.title}
            style={styles.category}
            onPress={() =>
              navigation.navigate("Providers", {
                category: category.title,
              })
            }
          >
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryDescription}>
              {category.description}
            </Text>
            {index === 0 && (
              <Ionicons
                name="hand-left-outline"
                size={16}
                color="#65D600"
                style={styles.categoryAction}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => navigation.navigate("SearchHome")}>
          <Ionicons name="home-outline" size={25} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="heart-outline" size={25} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="mail-outline" size={25} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="search-outline" size={25} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="cart-outline" size={25} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#004000",
    paddingTop: 38,
    paddingHorizontal: 18,
  },
  logo: {
    color: "white",
    fontSize: 29,
    fontWeight: "300",
    textAlign: "center",
    marginBottom: 12,
  },
  logoRed: {
    color: "#FF3333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 10,
    height: 36,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#222",
    fontSize: 12,
    paddingVertical: 4,
  },
  sectionTitle: {
    color: "#65D600",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  categoryList: {
    flex: 1,
    backgroundColor: "white",
  },
  categoryContent: {
    padding: 3,
  },
  category: {
    minHeight: 47,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderBottomWidth: 2,
    borderBottomColor: "#65D600",
    position: "relative",
  },
  categoryTitle: {
    color: "#111",
    fontSize: 10,
    fontWeight: "bold",
  },
  categoryDescription: {
    color: "#555",
    fontSize: 9,
    fontStyle: "italic",
    paddingRight: 12,
  },
  categoryAction: {
    position: "absolute",
    right: 5,
    bottom: 5,
  },
  bottomBar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
