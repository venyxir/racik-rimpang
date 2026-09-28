(() => {
  async function loadOverview() {
    const [admins, sellers, products, reviews] = await Promise.all([
      window.RuangStore.all('admins'),
      window.RuangStore.all('sellers'),
      window.RuangStore.all('products'),
      window.RuangStore.all('reviews')
    ]);

    const sellerSummaries = sellers.map(({ passwordHash, salt, ...seller }) => {
      const sellerProducts = products.filter((product) => product.ownerEmail === seller.email);
      const sellerReviews = reviews.filter((review) => window.RuangUtils.normalizePhone(review.sellerPhone) === window.RuangUtils.normalizePhone(seller.phone));
      const rating = sellerReviews.length
        ? sellerReviews.reduce((total, review) => total + Number(review.rating), 0) / sellerReviews.length
        : 0;
      return {
        ...seller,
        productCount: sellerProducts.length,
        reviewCount: sellerReviews.length,
        rating
      };
    });

    return {
      totals: {
        admins: admins.length,
        sellers: sellers.length,
        products: products.length,
        reviews: reviews.length
      },
      admins: admins.map(({ passwordHash, salt, ...admin }) => admin),
      sellers: sellerSummaries,
      products,
      reviews
    };
  }

  window.RuangAdminDashboardData = { loadOverview };
})();