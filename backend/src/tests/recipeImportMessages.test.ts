import { blockedImportMessage } from '../controllers/recipeImport';

describe('blockedImportMessage', () => {
  it('names the site and points to Photo and Manual import', () => {
    const msg = blockedImportMessage('https://www.allrecipes.com/recipe/16354/easy-meatloaf/');
    expect(msg).toMatch(/^allrecipes\.com doesn't let apps import its recipes/);
    expect(msg).toMatch(/Photo tab/);
    expect(msg).toMatch(/Manual tab/);
  });

  // Regression: the old message recommended AllRecipes, Serious Eats, Budget
  // Bytes and Simply Recipes, which all block imports themselves.
  it('does not recommend other recipe sites', () => {
    const msg = blockedImportMessage('https://www.budgetbytes.com/x/');
    for (const site of ['allrecipes', 'seriouseats', 'simplyrecipes', 'bonappetit']) {
      expect(msg.toLowerCase()).not.toContain(site);
    }
  });
});
