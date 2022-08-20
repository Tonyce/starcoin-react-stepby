address admin {
module UTest {

    // use StarcoinFramework::Signer;
    // use StarcoinFramework::Timestamp;
    // use StarcoinFramework::Account;
    // use StarcoinFramework::Token;
    use StarcoinFramework::Debug;
    use StarcoinFramework::Vector;
    use StarcoinFramework::Hash;

    struct MyCoin has key { value: u64 }

    public fun make_sure_non_zero_coin(coin: MyCoin): MyCoin {
        assert!(coin.value > 0, 0);
        coin
    }

    public fun has_coin(addr: address): bool {
        exists<MyCoin>(addr)
    }

    #[test]
    fun make_sure_non_zero_coin_passes() {
        let coin = MyCoin { value: 1 };
        let MyCoin { value: _ } = make_sure_non_zero_coin(coin);
    }

    #[test]
    fun test_hash_result() {
        let expect_vec = vector[
            100,  75, 204, 126,  86,  67, 115,   4,
            9, 153, 170, 200, 158, 118,  34, 243,
            202, 113, 251, 161, 217, 114, 253, 148,
            163,  28,  59, 251, 242,  78,  57,  56
        ];
        let temp_camp = Vector::empty();
        Vector::append(&mut temp_camp, b"hello world");
        let camp = Hash::sha3_256(temp_camp);
        Debug::print(&camp);
        assert!(&camp == &expect_vec, 1);
    }

}
}