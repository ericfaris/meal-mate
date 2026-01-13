import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../src/models/recipe';

dotenv.config();

const recipes = [
  {
    title: "Pork Tenderloin",
    ingredientsText: "Boxed rice\nFrozen peas",
    directionsText: "Cook as desired.",
  },
  {
    title: "Nana's Spaghetti",
    ingredientsText: "Ground beef\nTomato sauce\nSpaghetti noodles\nParmesan cheese\nGarlic bread",
    directionsText: "Cook as desired.",
  },
  {
    title: "Beef Tacos",
    ingredientsText: "Ground beef\nTaco mix\nHard or soft tacos\nRice\nSour cream\nCheese\nLettuce\nTomatoes",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Smashburgers",
    ingredientsText: "80/20 ground chuck\nOnion buns\nAmerican cheese\nKetchup\nMustard",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Chicken Fajitas",
    ingredientsText: "Chicken breast\nFajita seasoning\nPeppers\nOnions\nRice\nCheese\nFajita soft tacos\nSour cream\nLettuce\nTomatoes",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Chipotle Bowls",
    ingredientsText: "Chicken thighs\nLawry's fajita seasoning\nRice\nChicken tacos",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Ravioli Bake",
    ingredientsText: "Ravioli\nMozzarella cheese\nMarinara sauce",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Spaghetti Bake",
    ingredientsText: "Ground beef\nTomato sauce\nGarlic\nOnions\nDiced tomatoes\nShredded cheddar cheese\nAngel hair pasta",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Chicken Rice Soup",
    ingredientsText: "Chicken breast\nChopped onions\nChopped celery\nChopped carrots\nCream\nMilk\nWild rice",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Chicken Salad",
    ingredientsText: "Chicken breast\nMayonnaise\nCelery\nGrapes\nPecans\nCroissants",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Steak",
    ingredientsText: "Steak\nSeasoning",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Chicken Ranch Bites",
    ingredientsText: "Chicken breast\nPacket of ranch\nOlive oil",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Chicken Bacon Ranch Pizza",
    ingredientsText: "Chicken breast\nBacon\nRanch\nMozzarella cheese\nFlatbread",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Pulled Pork",
    ingredientsText: "Pork butt\nBarbecue sauce\nBuns",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Roast",
    ingredientsText: "Roast\nCarrots\nBob Evans potatoes\nOnions\nCream of mushroom",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Grilled Chicken Salads",
    ingredientsText: "Chicken breast\nRomaine lettuce\nShredded cheddar cheese\nHard boiled eggs\nBacon\nRed onion\nRanch dressing",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Chicken and Rice",
    ingredientsText: "Chicken breast\nWhite rice\nMilk\nCream of chicken\nBroccoli\nShredded cheddar cheese",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Sausage Egg Casserole",
    ingredientsText: "Eggs\nSausage\nCheese\nShredded hash brown potatoes\nToast\nFruit tray",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Pancakes, Eggs, and Bacon",
    ingredientsText: "Pancake mix\nEggs\nBacon\nToast\nSyrup\nJelly",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Skyline Chili",
    ingredientsText: "Skyline chili\nSpaghetti noodles\nShredded cheddar cheese\nChopped onions\nSoup crackers\nHot sauce",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Ham and Cheese Subs",
    ingredientsText: "Sub buns\nHam\nCheese\nShredded lettuce\nOnions\nPickles\nMayonnaise",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Grilled Cheese and Tomato Soup",
    ingredientsText: "Bread\nAmerican cheese\nTomato soup\nCream\nBasil\nBowtie pasta",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Chicken Quesadillas",
    ingredientsText: "Chicken\nTaco seasoning\nHernandez sauce\nTortillas\nShredded lettuce\nShredded cheese\nSour cream\nOnions\nTomatoes",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Ribs",
    ingredientsText: "Pork ribs\nBarbecue sauce\nBaked potatoes",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Ham Steak",
    ingredientsText: "Ham steak\nMacaroni and cheese\nBroccoli",
    directionsText: "Cook as desired.",
    complexity: "simple" as const,
  },
  {
    title: "Change Your Life Chicken",
    ingredientsText: "Chicken thighs\nFingerling potatoes\nOnions\nCarrots",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
  {
    title: "Meatloaf",
    ingredientsText: "Ground beef\nBread crumbs\nEggs\nKetchup\nOnions\nMashed potatoes\nCorn",
    directionsText: "Cook as desired.",
    complexity: "medium" as const,
  },
];

async function seedRecipes() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meal-mate';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log(`Inserting ${recipes.length} recipes...`);

    const result = await Recipe.insertMany(recipes);
    console.log(`Successfully inserted ${result.length} recipes:`);

    result.forEach((recipe, index) => {
      console.log(`  ${index + 1}. ${recipe.title}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding recipes:', error);
    process.exit(1);
  }
}

seedRecipes();
