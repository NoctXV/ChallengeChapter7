const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res, next) => {
    let { authorization } = req.headers;

    if (!authorization || !authorization.split(" ")[1]) {
        return res.status(401).json({
            status: false,
            message: "Token not found",
            data: null
        });
    }

    jwt.verify(authorization.split(" ")[1], JWT_SECRET_KEY, async (err, data) => {
        if (err) {
            return res.status(401).json({
                status: false,
                message: "False not authorized",
                err: err.message,
                data: null
            });
        }
        let user = await prisma.user.findFirst({ where: { id: data.id } });

        delete user.password

        req.user = user;
        next();
    });
};