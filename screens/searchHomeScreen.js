
import React from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  {
    title: "TRAITEURS",
    description: "Apéros, plats, festins... spécialités malgaches à profusion",
  },
  {
    title: "ENVOI COLIS",
    description: "France vers Madagascar, Madagascar vers la France",
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

export default function SearchHomeScreen({ navigation, route }) {
  const token = route.params?.token;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../assets/logo_paysage.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Que recherchez-vous ?"
            placeholderTextColor="#888888"
          />
          <Ionicons
            name="search-outline"
            size={22}
            color="#003300"
          />
        </View>

        <Text style={styles.sectionTitle}>
          Les plus recherchés
        </Text>

        <View style={styles.categoryList}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category.title}
              style={styles.category}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("Providers", {
                  category: category.title,
                  token,
                })
              }
            >
              <View style={styles.categoryText}>
                <Text style={styles.categoryTitle}>
                  {category.title}
                </Text>

                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              </View>

              <Ionicons
                name={
                  index === 0
                    ? "hand-left-outline"
                    : "chevron-forward"
                }
                size={20}
                color="#003300"
                style={styles.categoryIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 25,
  },
  logo: {
    width: "100%",
    height: 110,
    marginBottom: 18,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CDAB82",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 25,
  },
  searchInput: {
    flex: 1,
    color: "#003300",
    fontSize: 15,
    paddingVertical: 8,
  },
  sectionTitle: {
    color: "#66CC00",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  categoryList: {
    gap: 12,
  },
  category: {
    minHeight: 75,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CDAB82",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  categoryText: {
    flex: 1,
    paddingRight: 10,
  },
  categoryTitle: {
    color: "#003300",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  categoryDescription: {
    color: "#555555",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 19,
  },
  categoryIcon: {
    marginLeft: 5,
  },
});
