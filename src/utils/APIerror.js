class APIerror extends Error{ // node js gives Error class for api error 
 constructor(
    statusCode,
    message="something went wrong",
    errors=[],
    stack=""
 ){
    super(message)
    this.statusCode=statusCode
    this.data=null
    this.message=message
    this.success=false // as we are handling error
    this.errors=errors

    if(stack){
        this.stack=stack
    }
    else {
        Error.captureStackTrace(this,this.constructor)
    }
    
 }

}
export {APIerror}