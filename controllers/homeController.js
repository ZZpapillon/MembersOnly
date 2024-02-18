exports.home_get = (req, res) => {
    res.render("home", { isAuthenticated: req.isAuthenticated(), currentUser: req.user });
};
