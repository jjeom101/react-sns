function checkSql(err, result) {
    if (err) {
        console.error("SQL 쿼리 실행 중 오류:", err);
        throw new Error("데이터베이스 오류가 발생했습니다.");
    }
    if (result && result.affectedRows === 0) {
        console.log("SQL: 영향을 받은 행 없음");
        return false;
    }
    return true;
}

module.exports = {
    checkSql 
};