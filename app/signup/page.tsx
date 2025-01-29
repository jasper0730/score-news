import RegisterClient from "@/components/register/RegisterClient";

const SignUpPage = () => {
  return (<div className="flex justify-center w-full px-10 pt-[100px] pb-[50px]">
    <RegisterClient type={"signup"} className="max-w-md w-full" />
  </div>);
}

export default SignUpPage;