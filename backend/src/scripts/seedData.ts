import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import Recipe from '../models/recipe';
import Plan from '../models/plan';

// Load environment variables
dotenv.config();

const sampleRecipes = [
  {
    title: 'Sheet Pan Chicken Fajitas',
    imageUrl: '',
    sourceUrl: '',
    ingredientsText: `- 2 lbs chicken breast, sliced
- 3 bell peppers (assorted colors), sliced
- 1 large onion, sliced
- 3 tbsp olive oil
- 2 tsp chili powder
- 1 tsp cumin
- 1 tsp paprika
- Salt and pepper to taste
- Tortillas for serving
- Optional: sour cream, cheese, salsa`,
    directionsText: `1. Preheat oven to 425°F
2. Toss chicken, peppers, and onions with oil and spices on a large sheet pan
3. Spread in a single layer
4. Bake for 20-25 minutes, stirring halfway through
5. Serve with warm tortillas and desired toppings`,
    notes: 'Quick weeknight dinner! Can prep vegetables ahead of time.',
    tags: ['Quick', 'Chicken', 'SheetPan', 'Mexican'],
  },
  {
    title: 'One-Pot Pasta Primavera',
    imageUrl: '',
    sourceUrl: '',
    ingredientsText: `- 12 oz pasta (penne or fusilli)
- 2 cups cherry tomatoes, halved
- 1 zucchini, diced
- 1 yellow squash, diced
- 1 cup frozen peas
- 4 cloves garlic, minced
- 4 cups vegetable broth
- 1/2 cup heavy cream
- 1/2 cup parmesan cheese, grated
- 2 tbsp olive oil
- Fresh basil
- Salt and pepper`,
    directionsText: `1. Heat olive oil in a large pot over medium heat
2. Add garlic and cook until fragrant, about 1 minute
3. Add pasta, vegetables, and broth
4. Bring to a boil, then reduce heat and simmer 12-15 minutes, stirring occasionally
5. Stir in cream and parmesan
6. Season with salt and pepper
7. Garnish with fresh basil`,
    notes: 'Perfect for using up leftover vegetables. Very kid-friendly!',
    tags: ['Vegetarian', 'OnePot', 'Pasta', 'Quick'],
  },
  {
    title: 'Slow Cooker Beef Stew',
    imageUrl: '',
    sourceUrl: '',
    ingredientsText: `- 2 lbs beef chuck, cubed
- 4 carrots, chopped
- 3 potatoes, cubed
- 2 celery stalks, chopped
- 1 onion, diced
- 3 cloves garlic, minced
- 4 cups beef broth
- 2 tbsp tomato paste
- 2 tbsp flour
- 1 tsp thyme
- 2 bay leaves
- Salt and pepper`,
    directionsText: `1. Toss beef with flour, salt, and pepper
2. Add all ingredients to slow cooker
3. Stir to combine
4. Cook on LOW for 8 hours or HIGH for 4-5 hours
5. Remove bay leaves before serving
6. Adjust seasoning if needed`,
    notes: 'Great for meal prep! Freezes well. Even better the next day.',
    tags: ['SlowCooker', 'Beef', 'Comfort', 'MealPrep'],
  },
  {
    title: 'Baked Salmon with Lemon Herb Butter',
    imageUrl: '',
    sourceUrl: '',
    ingredientsText: `- 4 salmon fillets (6 oz each)
- 4 tbsp butter, softened
- 2 cloves garlic, minced
- 1 lemon (juice and zest)
- 2 tbsp fresh dill, chopped
- 1 tbsp fresh parsley, chopped
- Salt and pepper
- Lemon slices for garnish`,
    directionsText: `1. Preheat oven to 375°F
2. Mix butter, garlic, lemon zest, dill, and parsley
3. Season salmon with salt and pepper
4. Place salmon on a baking sheet lined with parchment
5. Spread herb butter on top of each fillet
6. Bake for 12-15 minutes until salmon flakes easily
7. Drizzle with lemon juice and garnish with lemon slices`,
    notes: 'Serve with roasted vegetables or rice. Very healthy and elegant!',
    tags: ['Seafood', 'Healthy', 'Quick', 'LowCarb'],
  },
  {
    title: 'Chicken Fried Rice',
    imageUrl: '',
    sourceUrl: '',
    ingredientsText: `- 3 cups cooked rice (day-old is best)
- 2 chicken breasts, diced
- 3 eggs, beaten
- 1 cup frozen mixed vegetables
- 3 green onions, sliced
- 3 cloves garlic, minced
- 3 tbsp soy sauce
- 1 tbsp sesame oil
- 2 tbsp vegetable oil
- Salt and pepper`,
    directionsText: `1. Heat 1 tbsp oil in a large wok or skillet over high heat
2. Cook chicken until done, remove and set aside
3. Add remaining oil, scramble eggs, and set aside
4. Add garlic and vegetables, stir-fry for 2 minutes
5. Add rice, breaking up clumps
6. Add chicken and eggs back to pan
7. Pour soy sauce and sesame oil over everything
8. Stir-fry for 3-4 minutes
9. Top with green onions`,
    notes: 'Perfect for using leftover rice and rotisserie chicken!',
    tags: ['Quick', 'Asian', 'Chicken', 'Leftovers'],
  },
  {
    title: 'Vegetarian Black Bean Tacos',
    imageUrl: '',
    sourceUrl: '',
    ingredientsText: `- 2 cans black beans, drained and rinsed
- 1 bell pepper, diced
- 1 onion, diced
- 2 cloves garlic, minced
- 1 tsp cumin
- 1 tsp chili powder
- 1/2 tsp paprika
- Corn or flour tortillas
- Toppings: lettuce, tomatoes, cheese, sour cream, avocado, salsa`,
    directionsText: `1. Sauté onion and bell pepper until soft, about 5 minutes
2. Add garlic and cook 1 minute
3. Add black beans and spices
4. Mash some of the beans with a fork
5. Cook until heated through, about 5 minutes
6. Warm tortillas
7. Fill tortillas with bean mixture and desired toppings`,
    notes: 'Budget-friendly and customizable. Kids love building their own!',
    tags: ['Vegetarian', 'Mexican', 'Quick', 'BudgetFriendly'],
  },
  {
    title: 'Classic Meatloaf',
    imageUrl: '',
    sourceUrl: '',
    ingredientsText: `- 2 lbs ground beef
- 1 cup breadcrumbs
- 1 onion, finely diced
- 2 eggs
- 1/2 cup milk
- 1/4 cup ketchup (plus more for topping)
- 2 tbsp Worcestershire sauce
- 2 cloves garlic, minced
- 1 tsp salt
- 1/2 tsp pepper
- 1/4 cup brown sugar (for glaze)`,
    directionsText: `1. Preheat oven to 350°F
2. Mix all ingredients except brown sugar in a large bowl
3. Form into a loaf and place in a baking dish
4. Mix 1/4 cup ketchup with brown sugar
5. Spread glaze on top of meatloaf
6. Bake for 1 hour or until internal temp reaches 160°F
7. Let rest 10 minutes before slicing`,
    notes: 'Great with mashed potatoes and green beans. Leftovers make amazing sandwiches!',
    tags: ['Comfort', 'Beef', 'Classic', 'Leftovers'],
  },
  {
    title: 'Thai Peanut Noodles',
    imageUrl: '',
    sourceUrl: '',
    ingredientsText: `- 12 oz rice noodles or spaghetti
- 1/2 cup peanut butter
- 3 tbsp soy sauce
- 2 tbsp rice vinegar
- 2 tbsp honey
- 1 tbsp sesame oil
- 2 cloves garlic, minced
- 1 tsp fresh ginger, grated
- 1/4 tsp red pepper flakes
- 2 cups shredded cabbage
- 1 carrot, julienned
- 3 green onions, sliced
- Chopped peanuts and cilantro for garnish`,
    directionsText: `1. Cook noodles according to package directions, drain
2. Whisk together peanut butter, soy sauce, vinegar, honey, sesame oil, garlic, ginger, and pepper flakes
3. Thin with 2-3 tbsp water if needed
4. Toss warm noodles with sauce
5. Add cabbage and carrots
6. Top with green onions, peanuts, and cilantro
7. Serve warm or cold`,
    notes: 'Great for meal prep! Can add grilled chicken or tofu for protein.',
    tags: ['Vegetarian', 'Asian', 'Quick', 'MealPrep'],
  },
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    console.log('Dropping old indexes...');
    try {
      await Recipe.collection.dropIndexes();
    } catch (error) {
      console.log('No indexes to drop (this is normal on first run)');
    }

    console.log('Clearing existing data...');
    await Recipe.deleteMany({});
    await Plan.deleteMany({});

    console.log('Inserting sample recipes...');
    const recipes = await Recipe.insertMany(sampleRecipes);
    console.log(`✅ Created ${recipes.length} sample recipes`);

    // Create a sample meal plan for the current week
    console.log('Creating sample meal plan...');
    const today = new Date();
    const plans = [];

    for (let i = 0; i < 7; i++) {
      const planDate = new Date(today);
      planDate.setDate(today.getDate() + i);
      const dateStr = planDate.toISOString().split('T')[0];

      if (i < recipes.length) {
        plans.push({
          date: dateStr,
          recipeId: recipes[i]._id,
          isConfirmed: i < 3, // First 3 days are confirmed
        });
      }
    }

    await Plan.insertMany(plans);
    console.log(`✅ Created ${plans.length} sample meal plans for this week`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\nSample recipes created:');
    recipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
