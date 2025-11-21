-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_user_role_designer;
DROP TRIGGER IF EXISTS trigger_update_user_role_shop;

-- Trigger for designer applications
DELIMITER $$

CREATE TRIGGER trigger_update_user_role_designer
AFTER UPDATE ON designer_applications
FOR EACH ROW
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE users SET role = 'designer', updated_at = NOW() WHERE id = NEW.user_id;
    ELSEIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
        UPDATE users SET role = 'customer', updated_at = NOW() WHERE id = NEW.user_id;
    END IF;
END$$

-- Trigger for shop applications
CREATE TRIGGER trigger_update_user_role_shop
AFTER UPDATE ON shop_applications
FOR EACH ROW
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE users SET role = 'business_owner', updated_at = NOW() WHERE id = NEW.user_id;
    ELSEIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
        UPDATE users SET role = 'customer', updated_at = NOW() WHERE id = NEW.user_id;
    END IF;
END$$

DELIMITER ;

